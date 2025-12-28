import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { EventListResponse, EventCardDTO } from '@/types/events';

// Mock данни за тестване
const mockEvents: EventCardDTO[] = [
  {
    id: 'evt_1',
    title: 'Доброволческо почистване на парк Ботев',
    start_at: '2025-10-26T09:00:00+02:00',
    end_at: '2025-10-26T12:00:00+02:00',
    location: {
      address: 'Парк Ботев, Ботевград',
      lat: 42.9,
      lng: 23.8,
    },
    is_online: false,
    organizer: 'СелНет',
    category: 'community',
    poster: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800',
    rsvp_count: 36,
    status: 'published',
    created_at: '2025-10-10T12:00:00Z',
  },
  {
    id: 'evt_2',
    title: 'Онлайн семинар: Дигитално образование',
    start_at: '2025-10-28T18:00:00+02:00',
    end_at: '2025-10-28T20:00:00+02:00',
    is_online: true,
    organizer: 'Общинска библиотека',
    category: 'education',
    rsvp_count: 52,
    status: 'published',
    created_at: '2025-10-12T14:30:00Z',
  },
  {
    id: 'evt_3',
    title: 'Футболен турнир за деца',
    start_at: '2025-10-30T10:00:00+02:00',
    end_at: '2025-10-30T16:00:00+02:00',
    location: {
      address: 'Градски стадион, Ботевград',
      lat: 42.905,
      lng: 23.79,
    },
    is_online: false,
    organizer: 'Спортен клуб Ботев',
    category: 'sport',
    poster: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    rsvp_count: 24,
    status: 'published',
    created_at: '2025-10-15T09:00:00Z',
  },
  {
    id: 'evt_4',
    title: 'Концерт на местни изпълнители',
    start_at: '2025-11-02T19:00:00+02:00',
    end_at: '2025-11-02T22:00:00+02:00',
    location: {
      address: 'Читалище Просвета, Ботевград',
      lat: 42.908,
      lng: 23.785,
    },
    is_online: false,
    organizer: 'Читалище Просвета',
    category: 'culture',
    rsvp_count: 89,
    status: 'published',
    created_at: '2025-10-08T16:00:00Z',
  },
  {
    id: 'evt_5',
    title: 'Общинско събрание',
    start_at: '2025-10-25T17:00:00+02:00',
    end_at: '2025-10-25T19:00:00+02:00',
    location: {
      address: 'Заседателна зала, Община Ботевград',
      lat: 42.903,
      lng: 23.792,
    },
    is_online: true,
    organizer: 'Община Ботевград',
    category: 'meeting',
    rsvp_count: 67,
    status: 'published',
    created_at: '2025-10-05T10:00:00Z',
  },
  {
    id: 'evt_6',
    title: 'Екологична работилница за деца',
    start_at: '2025-11-05T14:00:00+02:00',
    end_at: '2025-11-05T17:00:00+02:00',
    location: {
      address: 'Екопарк, Ботевград',
      lat: 42.912,
      lng: 23.788,
    },
    is_online: false,
    organizer: 'Еко инициатива',
    category: 'ecology',
    poster: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    rsvp_count: 18,
    status: 'published',
    created_at: '2025-10-18T11:30:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const sort = searchParams.get('sort') || 'start_at';
    const when = searchParams.get('when') || 'upcoming';
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q');
    const categoryParam = searchParams.get('category');
    const online = searchParams.get('online');

    let items: EventCardDTO[] = [];
    let useFirestore = false;

    // Опит да се зареди от Firestore
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        useFirestore = true;
        let query = adminDb.collection('events').limit(limit * 2);

        if (categoryParam && categoryParam.startsWith('in(')) {
          const categories = categoryParam.slice(3, -1).split(',');
          query = query.where('category', 'in', categories) as any;
        }

        const snapshot = await query.get();
        
        items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            start_at: data.start_at || data.when || new Date().toISOString(),
            end_at: data.end_at || data.start_at || data.when || new Date().toISOString(),
            location: data.location || (data.where ? { address: data.where } : undefined),
            is_online: data.is_online || false,
            organizer: data.organizer || data.createdBy || 'Неизвестен',
            category: data.category || 'other',
            poster: data.poster,
            rsvp_count: data.rsvp_count || 0,
            status: data.status || 'published',
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
          } as EventCardDTO;
        });

        const now = new Date();

        // Time filter
        if (when === 'upcoming') {
          items = items.filter(event => new Date(event.start_at) > now);
        } else if (when === 'past') {
          items = items.filter(event => new Date(event.end_at) < now);
        } else if (when === 'today') {
          const today = now.toDateString();
          items = items.filter(event => new Date(event.start_at).toDateString() === today);
        }

        // Search
        if (q) {
          const query = q.toLowerCase();
          items = items.filter(event => 
            event.title.toLowerCase().includes(query) ||
            event.organizer.toLowerCase().includes(query) ||
            (event.location?.address || '').toLowerCase().includes(query)
          );
        }

        // Online/offline filter
        if (online === 'true') {
          items = items.filter(event => event.is_online);
        } else if (online === 'false') {
          items = items.filter(event => !event.is_online);
        }

        // Sort
        if (sort === 'start_at') {
          items.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        } else if (sort === '-created_at') {
          items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sort === '-rsvp_count') {
          items.sort((a, b) => b.rsvp_count - a.rsvp_count);
        }

        items = items.slice(0, limit);

      } catch (firestoreError) {
        console.error('[Firestore] Error loading events:', firestoreError);
        useFirestore = false;
      }
    }

    // Fallback към mock данни
    if (!useFirestore || items.length === 0) {
      console.log('[API] Using mock events data');
      let filtered = [...mockEvents];

      const now = new Date();

      // Time filter
      if (when === 'upcoming') {
        filtered = filtered.filter(event => new Date(event.start_at) > now);
      } else if (when === 'past') {
        filtered = filtered.filter(event => new Date(event.end_at) < now);
      } else if (when === 'today') {
        const today = now.toDateString();
        filtered = filtered.filter(event => new Date(event.start_at).toDateString() === today);
      }

      // Search
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(event => 
          event.title.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query) ||
          (event.location?.address || '').toLowerCase().includes(query)
        );
      }

      // Category filter
      if (categoryParam && categoryParam.startsWith('in(')) {
        const categories = categoryParam.slice(3, -1).split(',');
        filtered = filtered.filter(event => categories.includes(event.category));
      }

      // Online/offline filter
      if (online === 'true') {
        filtered = filtered.filter(event => event.is_online);
      } else if (online === 'false') {
        filtered = filtered.filter(event => !event.is_online);
      }

      // Sort
      if (sort === 'start_at') {
        filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      } else if (sort === '-created_at') {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sort === '-rsvp_count') {
        filtered.sort((a, b) => b.rsvp_count - a.rsvp_count);
      }

      items = filtered.slice(0, limit);
    }

    const hasMore = items.length >= limit;

    const response: EventListResponse = {
      items,
      total: items.length,
      next_cursor: hasMore ? 'next_page' : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiRequirePermission } = await import('@/lib/auth/rbac');
    const user = await apiRequirePermission("create:event");
    
    const body = await req.json();
    const {
      title,
      description,
      location,
      start_date,
      end_date,
      max_participants,
      cover_image,
    } = body;
    
    if (!title || !description || !location || !start_date) {
      return NextResponse.json(
        { error: "Задължителните полета липсват" },
        { status: 400 }
      );
    }
    
    const eventData = {
      title,
      description,
      location,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
      max_participants: max_participants || null,
      cover_image: cover_image || null,
      organizer_id: user.uid,
      organizer_name: user.displayName || user.email,
      created_at: new Date(),
      updated_at: new Date(),
      rsvp_count: 0,
      is_past: new Date(start_date) < new Date(),
    };
    
    const docRef = await adminDb.collection("events").add(eventData);
    
    return NextResponse.json({
      event: {
        id: docRef.id,
        ...eventData,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
