import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { SignalListResponse, SignalCardDTO } from '@/types/signals';
import { apiRequirePermission } from '@/lib/auth/rbac';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getSessionUser } from '@/lib/auth/server-session';

const mockSignals: SignalCardDTO[] = [
  {
    id: 'sig_1',
    title: 'Неизправно улично осветление на ул. Рила',
    description: 'Три лампи не работят от седмица, района е много тъмен вечер',
    photos: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800'],
    location: {
      address: 'ул. Рила 12, Ботевград',
      lat: 42.9,
      lng: 23.8,
    },
    status: 'v_process',
    priority: 'normal',
    category: 'Осветление',
    comments_count: 5,
    votes_support: 23,
    watchers: 14,
    sla: {
      tta_hours: 12,
      ttr_days: null,
      overdue: false,
    },
    created_at: '2025-10-14T10:30:00Z',
    updated_at: '2025-10-15T08:00:00Z',
  },
  {
    id: 'sig_2',
    title: 'Дупка на главен път',
    description: 'Голяма дупка на кръстовището, опасно за автомобили',
    photos: ['https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800'],
    location: {
      address: 'бул. България, Ботевград',
      lat: 42.91,
      lng: 23.81,
    },
    status: 'novo',
    priority: 'high',
    category: 'Пътища и тротоари',
    comments_count: 12,
    votes_support: 45,
    watchers: 28,
    sla: {
      tta_hours: 36,
      ttr_days: null,
      overdue: false,
    },
    created_at: '2025-10-20T14:20:00Z',
    updated_at: '2025-10-20T14:20:00Z',
  },
  {
    id: 'sig_3',
    title: 'Препълнен контейнер за смет',
    description: 'Контейнерът е пълен от 3 дни, боклуците са около него',
    photos: [],
    location: {
      address: 'ул. Васил Левски 45, Ботевград',
      lat: 42.905,
      lng: 23.79,
    },
    status: 'v_process',
    priority: 'normal',
    category: 'отпадъци',
    comments_count: 3,
    votes_support: 18,
    watchers: 9,
    sla: {
      tta_hours: 8,
      ttr_days: null,
      overdue: false,
    },
    created_at: '2025-10-18T09:15:00Z',
    updated_at: '2025-10-19T11:00:00Z',
  },
  {
    id: 'sig_4',
    title: 'Счупена пейка в парк Ботев',
    description: 'Пейката до чешмата е счупена и опасна',
    photos: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'],
    location: {
      address: 'Парк Ботев, Ботевград',
      lat: 42.902,
      lng: 23.795,
    },
    status: 'zavarsheno',
    priority: 'low',
    category: 'Друго',
    comments_count: 7,
    votes_support: 15,
    watchers: 6,
    sla: {
      tta_hours: null,
      ttr_days: 5,
      overdue: false,
    },
    created_at: '2025-10-10T16:45:00Z',
    updated_at: '2025-10-21T10:30:00Z',
  },
  {
    id: 'sig_5',
    title: 'Теч на водопровод',
    description: 'Вода тече от тротоара, вероятно счупена тръба',
    photos: ['https://images.unsplash.com/photo-1584622781867-8c0011bd9a06?w=800'],
    location: {
      address: 'ул. Христо Ботев 23, Ботевград',
      lat: 42.908,
      lng: 23.782,
    },
    status: 'novo',
    priority: 'urgent',
    category: 'ВиК',
    comments_count: 8,
    votes_support: 32,
    watchers: 19,
    sla: {
      tta_hours: 45,
      ttr_days: null,
      overdue: false,
    },
    created_at: '2025-10-21T08:00:00Z',
    updated_at: '2025-10-21T08:00:00Z',
  },
  {
    id: 'sig_6',
    title: 'Повредена детска площадка',
    description: 'Люлката е счупена, пясъчникът е замърсен',
    photos: [],
    location: {
      address: 'кв. Изток, Ботевград',
      lat: 42.912,
      lng: 23.788,
    },
    status: 'v_process',
    priority: 'high',
    category: 'Транспорт',
    comments_count: 15,
    votes_support: 56,
    watchers: 34,
    sla: {
      tta_hours: null,
      ttr_days: 3,
      overdue: false,
    },
    created_at: '2025-10-16T11:20:00Z',
    updated_at: '2025-10-19T14:30:00Z',
  },
];


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase();
    const sort = searchParams.get('sort') || '-created_at';

    // Помощна функция за почистване на параметрите
    // Маха "in(", ")", единични и двойни кавички
    const cleanParam = (val: string | null) => {
      if (!val || val === 'all') return null;
      let cleaned = val;

      // Маха in(...)
      if (cleaned.startsWith('in(') && cleaned.endsWith(')')) {
        cleaned = cleaned.slice(3, -1);
      }

      // Маха кавички в началото и края (напр. 'Врачеш' -> Врачеш)
      cleaned = cleaned.replace(/^['"]+|['"]+$/g, '').trim();

      return cleaned;
    };

    const statusParam = cleanParam(searchParams.get('status'));
    const categoryParam = cleanParam(searchParams.get('category'));
    const districtParam = cleanParam(searchParams.get('district'));
    const mineParam = searchParams.get('mine') === 'true';

    let query: any = adminDb.collection('signals');

    // ФИЛТЪР: МОИТЕ СИГНАЛИ
    if (mineParam) {
      try {
        console.log("[API] Processing mine=true filter");
        const user = await getSessionUser();
        
        if (!user) {
          console.log("[API] Unauthorized access for mine=true");
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        console.log("[API] Filtering by author_id:", user.uid);
        query = query.where('author_id', '==', user.uid);
      } catch (authError: any) {
        console.error("[API] Auth error in signals route:", authError);
        return NextResponse.json({ 
          error: "Authentication Failed", 
          details: authError.message 
        }, { status: 500 });
      }
    }

    // ФИЛТЪР: СТАТУС
    if (statusParam) {
      query = query.where('status', '==', statusParam);
    }

    // ФИЛТЪР: КАТЕГОРИЯ
    if (categoryParam) {
      query = query.where('category', '==', categoryParam);
    }

    // ФИЛТЪР: НАСЕЛЕНО МЯСТО
    if (districtParam) {
      query = query.where('district', '==', districtParam);
    }

    // СОРТИРАНЕ
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const field = sort.replace('-', '');

    // ВАЖНО: Firestore изисква индекс за where() + orderBy()
    query = query.orderBy(field, direction);

    const snapshot = await query.get();

    let items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data()
    })) as SignalCardDTO[];

    // ТЪРСЕНЕ (Client-side filter)
    if (q) {
      items = items.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.id.includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ items, total: items.length });
  } catch (error: any) {
    // Връщаме детайлна грешка, за да видим линка за индекса в конзолата на браузъра
    console.error("API Error Detailed:", error);
    return NextResponse.json({
      items: [],
      error: error.message,
      details: "Check server console for Firestore Index URL"
    }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      district,
      address,
      latitude,
      longitude,
      image_url,
      author_id,
    } = body;

    if (!title || !description || !category || !district) {
      return NextResponse.json(
        { error: "Задължителните полета липсват" },
        { status: 400 }
      );
    }

    // Вземи информация за текущия потребител от сесията
    const sessionUser = await getSessionUser();

    const now = Date.now();
    const signalData = {
      title,
      desc: description,
      description,
      category,
      district,
      settlementLabel: district,
      address: address || district,
      geo: {
        lat: latitude ? parseFloat(latitude) : 42.9 + Math.random() * 0.02,
        lng: longitude ? parseFloat(longitude) : 23.78 + Math.random() * 0.02,
      },
      location: {
        address: address ? `${address}, ${district}` : district,
        lat: latitude ? parseFloat(latitude) : 42.9 + Math.random() * 0.02,
        lng: longitude ? parseFloat(longitude) : 23.78 + Math.random() * 0.02,
      },
      status: "novo",
      priority: "normal",
      // Автор информация от сесията
      author_id: sessionUser?.uid || author_id || "anonymous",
      author_email: sessionUser?.email || null,
      author_name: sessionUser?.displayName || sessionUser?.email?.split("@")[0] || null,
      photos: image_url ? [image_url] : [],
      createdAt: now,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comments_count: 0,
      votes_support: 0,
      watchers: 0,
    };

    // Save to Firebase
    const docRef = await adminDb.collection("signals").add(signalData);

    console.log("[API] Signal created:", docRef.id);

    return NextResponse.json({
      signal: {
        id: docRef.id,
        ...signalData,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/signals error:", error);
    return NextResponse.json({ error: "Грешка при създаване на сигнал" }, { status: 500 });
  }
}
