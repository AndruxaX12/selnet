import axios from 'axios';
import * as cheerio from 'cheerio';

// FIX: Използваме require с cast към any, за да избегнем липсата на типове за pdf-parse
// Увери се, че имаш @types/node инсталиран (npm install -D @types/node)
const pdf = require('pdf-parse') as any;

const ERM_BASE_URL = 'https://info.ermzapad.bg/webint/vok/avplan.php';

// SFO е кодът за София Област (Ботевград е там)
const REGIONS = ['SFO'];

const TARGET_LOCATIONS = [
  'БОТЕВГРАД', 'ТРУДОВЕЦ', 'ВРАЧЕШ', 'СКРАВЕНА', 'ЛИТАКОВО',
  'НОВАЧЕНЕ', 'ГУРКОВО', 'РАДОТИНА', 'РАШКОВО', 'БОЖЕНИЦА',
  'ЕЧЕМИШКА', 'ЛИПНИЦА', 'КРАЕВО'
];

export interface PowerOutage {
  type: 'accident' | 'planned';
  status: 'upcoming' | 'active';
  location: string;
  description: string;
  timeStart: string;
  timeEnd: string;
  reason: string;
  sourceUrl: string;
  publishedAt: string;
  externalId: string;
}

/* -------------------------------------------------------------
   ПОМОЩНА ФУНКЦИЯ ЗА ЗАЯВКИ
------------------------------------------------------------- */
async function postForm(params: Record<string, string>, responseType: 'json' | 'arraybuffer' | 'text' = 'json') {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  return axios.post(ERM_BASE_URL, formData.toString(), {
    responseType: responseType as any, // TypeScript cast
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://info.ermzapad.bg/webint/vok/avplan.php'
    }
  });
}

/* -------------------------------------------------------------
   ТЕКУЩИ АВАРИИ (LIVE DATA OT КАРТАТА)
------------------------------------------------------------- */
async function getCurrentOutages(): Promise<PowerOutage[]> {
  const results: PowerOutage[] = [];

  for (const region of REGIONS) {
    try {
      // Взимаме данните като TEXT, защото понякога JSON-ът е счупен
      const response = await postForm({
        'action': 'draw',
        'gm_obstina': region,
        'lat': '0',
        'lon': '0'
      }, 'text');

      let dataString = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Почистване ако сървърът върне HTML преди JSON-а
      const jsonStartIndex = dataString.indexOf('{');
      if (jsonStartIndex > -1) {
        dataString = dataString.substring(jsonStartIndex);
      }

      let items: any = {};
      try {
        items = JSON.parse(dataString);
      } catch (e) {
        // console.log('Невалиден JSON от ЕРМ, пропускаме...');
        continue;
      }

      Object.values(items).forEach((item: any) => {
        if (!item || typeof item !== 'object') return;

        const cities = (item.cities || '').toUpperCase();
        const cityName = (item.city_name || '').toUpperCase();

        // Проверка дали е за Ботевград и селата
        const isTarget = TARGET_LOCATIONS.some(loc =>
          cities.includes(loc) || cityName.includes(loc)
        );

        if (isTarget) {
          results.push({
            type: 'accident',
            status: 'active',
            location: item.city_name || 'Неизвестно',
            description: `Авария (${item.typedist}). Засегнати: ${item.cities}`,
            timeStart: item.begin_event,
            timeEnd: item.end_event || 'Неизвестно',
            reason: item.typedist || 'Авария',
            sourceUrl: `${ERM_BASE_URL}`,
            publishedAt: new Date().toISOString(),
            externalId: `curr_${item.lat}_${item.lon}_${item.begin_event}`
          });
        }
      });

    } catch (error) {
      console.error(`⚠️ Грешка при област ${region}:`, error instanceof Error ? error.message : String(error));
    }
  }

  return results;
}

/* -------------------------------------------------------------
   ПЛАНОВИ (PDF ЧЕТЕНЕ)
------------------------------------------------------------- */
async function getPlannedOutages(): Promise<PowerOutage[]> {
  const results: PowerOutage[] = [];

  try {
    // 1. Взимаме HTML списъка с линкове
    const { data: htmlList } = await postForm({ 'action': 'showpdf' }, 'text');

    const $ = cheerio.load(htmlList);
    const docIds: string[] = [];

    // Вадим ID-тата от href="javascript:previewdoc(1234)"
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('previewdoc')) {
        const match = href.match(/previewdoc\((\d+)\)/);
        if (match && match[1]) docIds.push(match[1]);
      }
    });

    // Взимаме последните 3 файла (за днес и следващите дни)
    const recentIds = docIds.slice(0, 3);

    for (const docId of recentIds) {
      try {
        // 2. Теглим PDF-а като буфер
        const response = await postForm({
          'action': 'showdocid',
          'doc_id': docId
        }, 'arraybuffer');

        const buffer = Buffer.from(response.data as ArrayBuffer);


        // 3. Парсване на PDF
        const pdfData = await pdf(buffer);
        // Махаме новите редове, за да търсим лесно фрази
        const text = pdfData.text.replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ");

        // 4. Търсене: Намираме дати и гледаме дали Ботевград е споменат преди тях
        // Regex за час: 13.12.2025 09:00 - 16:30
        const timeRegex = /(\d{1,2}\.\d{2}\.\d{4})(?:\s*г\.)?\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g;

        let match;
        while ((match = timeRegex.exec(text)) !== null) {
          const [fullStr, dateStr, startClock, endClock] = match;

          // Гледаме 500 символа НАЗАД от датата, за да видим кое село е споменато
          const startIndex = Math.max(0, match.index - 500);
          const contextText = text.substring(startIndex, match.index).toUpperCase();

          const foundLoc = TARGET_LOCATIONS.find(loc => contextText.includes(loc));

          if (foundLoc) {
            // Изрязваме описанието
            let desc = text.substring(match.index - 200, match.index + 200);

            results.push({
              type: 'planned',
              status: 'upcoming',
              location: foundLoc,
              description: `Планов ремонт: ${desc.substring(0, 150)}...`,
              timeStart: `${dateStr} ${startClock}`,
              timeEnd: `${dateStr} ${endClock}`,
              reason: 'Планов ремонт',
              sourceUrl: `${ERM_BASE_URL}?doc_id=${docId}`,
              publishedAt: new Date().toISOString(),
              externalId: `plan_${docId}_${foundLoc}_${dateStr}`
            });
          }
        }

      } catch (e) {
        console.error(`⚠️ Грешка при PDF ID ${docId}:`, e instanceof Error ? e.message : e);
      }
    }

  } catch (error) {
    console.error('⚠️ Грешка при планирани:', error);
  }

  return results;
}

/* -------------------------------------------------------------
   MAIN
------------------------------------------------------------- */
export async function scrapeErmBotevgrad(): Promise<PowerOutage[]> {
  const [current, planned] = await Promise.all([
    getCurrentOutages(),
    getPlannedOutages()
  ]);

  const all = [...current, ...planned];

  // Премахване на дубликати по ID
  const unique = Array.from(new Map(all.map(item => [item.externalId, item])).values());

  console.log(JSON.stringify(unique, null, 2));
  return unique;
}

// Стартиране (ако се пуска директно)
