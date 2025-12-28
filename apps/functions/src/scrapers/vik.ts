import axios from 'axios';
import * as cheerio from 'cheerio';

const VIK_ACCIDENTS_URL = 'https://viksofbg.com/rayon/botevgrad/?post_type=accident';
const VIK_REPAIRS_URL = 'https://viksofbg.com/rayon/botevgrad/?post_type=scheduled_repair';

export interface WaterAlert {
  type: 'accident' | 'repair';
  title: string;
  location: string;
  description: string;
  startTime?: string;
  endTime?: string;
  sourceUrl: string;
  publishedAt: string;
}

// Почиства текста, но оставя интервали, за да не се слепват думите
const cleanText = (text: string) => text.replace(/[\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

export async function scrapeVikBotevgrad(): Promise<WaterAlert[]> {
  const alerts: WaterAlert[] = [];

  try {
    // ---------------------------------------------------------
    // 1. АВАРИИ (ACCIDENTS)
    // ---------------------------------------------------------
    const accidentsHtml = await axios.get(VIK_ACCIDENTS_URL);
    const $acc = cheerio.load(accidentsHtml.data);

    $acc('article.type-accident').each((_, element) => {
      const el = $acc(element);
      // Взимаме текста с разделител интервал, за да не се лепи "селотоРайон"
      const fullText = cleanText(el.text().replace(/<\/?[^>]+(>|$)/g, " ")); 
      const title = cleanText(el.find('h3').text());
      
      // 1. ЛОКАЦИЯ
      let location = title; 
      // Търсим текст между "Район Ботевград," и "Местоположение:" или "Предполагаемо"
      const locMatch = fullText.match(/Район Ботевград,[\s]*(.*?)(?=\s*Местоположение|Предполагаемо)/i);
      if (locMatch && locMatch[1].trim().length > 2) {
        location = locMatch[1].trim(); // Пример: "с. Новачене"
      } else {
        // Fallback: Ако няма точен match, махаме "Авария на" от заглавието
        location = location.replace('Aвария на', '').replace('Авария на', '').trim();
      }

      // 2. ВРЕМЕ (КРАЙ)
      let endTime = '';
      // Търси всичко след "отстраняване:" до края или до следваща главна буква
      const timeMatch = fullText.match(/време за отстраняване:[\s]*(.*?)(?=$|Прочети)/i);
      if (timeMatch) endTime = timeMatch[1].trim();

      alerts.push({
        type: 'accident',
        title,
        location, // Вече трябва да е "с. Новачене" или улица
        description: fullText,
        endTime,
        startTime: new Date().toISOString(),
        sourceUrl: VIK_ACCIDENTS_URL,
        publishedAt: new Date().toISOString()
      });
    });

    // ---------------------------------------------------------
    // 2. ПЛАНОВИ РЕМОНТИ (SCHEDULED REPAIRS)
    // ---------------------------------------------------------
    const repairsHtml = await axios.get(VIK_REPAIRS_URL);
    const $rep = cheerio.load(repairsHtml.data);

    $rep('article.type-scheduled_repair').each((_, element) => {
      const el = $rep(element);
      // Добавяме интервали около таговете, преди да вземем текста
      const fullText = cleanText(el.text().replace(/<br>/g, " ").replace(/<\/p>/g, " "));
      const title = cleanText(el.find('h3').text());

      // 1. ЛОКАЦИЯ
      let location = title;
      // Търсим какво има след "Район Ботевград," и преди "Планирано"
      const locMatch = fullText.match(/Район Ботевград,[\s]*(.*?)(?=\s*Планирано)/i);
      if (locMatch && locMatch[1].trim().length > 2) {
         location = locMatch[1].trim();
      }

      // 2. ВРЕМЕНА
      let startTime = '';
      let endTime = '';

      // Regex сега хваща и думи (като "от", "до") и цифри
      const startMatch = fullText.match(/Планирано начало:[\s]*(.*?)(?=\s*Планиран край)/i);
      if (startMatch) startTime = startMatch[1].trim();

      const endMatch = fullText.match(/Планиран край:[\s]*(.*?)(?=$|Прочети)/i);
      if (endMatch) endTime = endMatch[1].trim();

      alerts.push({
        type: 'repair',
        title,
        location,
        description: fullText,
        startTime,
        endTime,
        sourceUrl: VIK_REPAIRS_URL,
        publishedAt: new Date().toISOString()
      });
    });

    return alerts;

  } catch (error) {
    console.error('❌ Грешка при ВиК scraping:', error);
    return [];
  }
}

// --- ТЕСТ ---
scrapeVikBotevgrad().then(d => console.log(JSON.stringify(d, null, 2)));