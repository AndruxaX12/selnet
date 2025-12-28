import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { IdeaListResponse, IdeaCardDTO } from '@/types/ideas';

// Mock данни за тестване
const mockIdeas: IdeaCardDTO[] = [
  {
    id: 'idea_1',
    title: 'Повече велостойки около училищата',
    summary: 'Предвиждане на 50 нови стойки на ключови локации около училища и обществени сгради',
    author: { name: 'Иван Петров', role: 'Гражданин' },
    category: 'transport',
    tags: ['велосипеди', 'училище', 'транспорт'],
    attachments: [],
    status: 'obsuzhdane',
    support_count: 124,
    comments_count: 18,
    created_at: '2025-10-12T08:00:00Z',
  },
  {
    id: 'idea_2',
    title: 'Зелена зона в центъра',
    summary: 'Създаване на малък парк с цветя и пейки на площада',
    author: { name: 'Мария Иванова' },
    category: 'ecology',
    tags: ['парк', 'зелени площи', 'център'],
    attachments: [],
    status: 'novo',
    support_count: 89,
    comments_count: 12,
    created_at: '2025-10-18T14:30:00Z',
  },
  {
    id: 'idea_3',
    title: 'Безплатен WiFi в парковете',
    summary: 'Монтиране на безплатен интернет достъп в градските паркове и градини',
    author: { name: 'Георги Стоянов', role: 'IT специалист' },
    category: 'infrastructure',
    tags: ['wifi', 'интернет', 'технологии'],
    attachments: [],
    status: 'v_razrabotka',
    support_count: 156,
    comments_count: 24,
    created_at: '2025-10-08T10:15:00Z',
  },
  {
    id: 'idea_4',
    title: 'Детски кът в библиотеката',
    summary: 'Обособяване на специална зона за деца с книги и играчки',
    author: { name: 'Елена Димитрова' },
    category: 'education',
    tags: ['деца', 'библиотека', 'образование'],
    attachments: [],
    status: 'planirano',
    support_count: 67,
    comments_count: 9,
    deadline: '2025-12-31T23:59:59Z',
    created_at: '2025-10-05T16:45:00Z',
  },
  {
    id: 'idea_5',
    title: 'Открит спортен комплекс',
    summary: 'Изграждане на съвременна спортна площадка с уреди за фитнес на открито',
    author: { name: 'Петър Николов', role: 'Спортен треньор' },
    category: 'sport',
    tags: ['спорт', 'фитнес', 'здраве'],
    attachments: [],
    status: 'obsuzhdane',
    support_count: 203,
    comments_count: 31,
    created_at: '2025-10-15T09:20:00Z',
  },
  {
    id: 'idea_6',
    title: 'Общинска градина за споделяне',
    summary: 'Отделяне на терен за градинарство, където гражданите могат да отглеждат зеленчуци',
    author: { name: 'Стоянка Георгиева' },
    category: 'ecology',
    tags: ['градинарство', 'екология', 'общност'],
    attachments: [],
    status: 'novo',
    support_count: 91,
    comments_count: 15,
    created_at: '2025-10-19T11:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const sort = searchParams.get('sort') || '-created_at';
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q');
    const statusParam = searchParams.get('status');
    const categoryParam = searchParams.get('category');

    let items: IdeaCardDTO[] = [];
    let useFirestore = false;

    // Опит да се зареди от Firestore
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        useFirestore = true;
        let query = adminDb.collection('ideas').orderBy('created_at', 'desc').limit(limit);

        // Status filter
        if (statusParam && statusParam.startsWith('in(')) {
          const statuses = statusParam.slice(3, -1).split(',');
          query = query.where('status', 'in', statuses) as any;
        }

        // Category filter
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
            summary: data.summary || data.desc || '',
            author: data.author || { name: 'Аноним' },
            category: data.category || 'other',
            tags: data.tags || [],
            attachments: data.attachments || [],
            status: data.status || 'novo',
            support_count: data.support_count || data.votesCount || 0,
            comments_count: data.comments_count || 0,
            deadline: data.deadline,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
          } as IdeaCardDTO;
        });

        // Search filter
        if (q) {
          const query = q.toLowerCase();
          items = items.filter(idea => 
            idea.title.toLowerCase().includes(query) ||
            idea.summary.toLowerCase().includes(query) ||
            idea.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        // Sort
        if (sort === '-support_count') {
          items.sort((a, b) => b.support_count - a.support_count);
        } else if (sort === '-comments_count') {
          items.sort((a, b) => b.comments_count - a.comments_count);
        }

      } catch (firestoreError) {
        console.error('[Firestore] Error loading ideas:', firestoreError);
        useFirestore = false;
      }
    }

    // Fallback към mock данни
    if (!useFirestore || items.length === 0) {
      console.log('[API] Using mock ideas data');
      let filtered = [...mockIdeas];

      // Search
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(idea => 
          idea.title.toLowerCase().includes(query) ||
          idea.summary.toLowerCase().includes(query) ||
          idea.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Status filter
      if (statusParam && statusParam.startsWith('in(')) {
        const statuses = statusParam.slice(3, -1).split(',');
        filtered = filtered.filter(idea => statuses.includes(idea.status));
      }

      // Category filter
      if (categoryParam && categoryParam.startsWith('in(')) {
        const categories = categoryParam.slice(3, -1).split(',');
        filtered = filtered.filter(idea => categories.includes(idea.category));
      }

      // Sort
      if (sort === '-created_at') {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sort === '-support_count') {
        filtered.sort((a, b) => b.support_count - a.support_count);
      } else if (sort === '-comments_count') {
        filtered.sort((a, b) => b.comments_count - a.comments_count);
      }

      items = filtered.slice(0, limit);
    }

    const hasMore = items.length >= limit;

    const response: IdeaListResponse = {
      items,
      total: items.length,
      next_cursor: hasMore ? 'next_page' : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/ideas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiRequirePermission } = await import('@/lib/auth/rbac');
    const user = await apiRequirePermission("create:idea");
    
    const body = await req.json();
    const {
      title,
      summary,
      description,
      category,
      expected_impact,
      estimated_cost,
      timeline,
    } = body;
    
    if (!title || !summary || !description || !category) {
      return NextResponse.json(
        { error: "Задължителните полета липсват" },
        { status: 400 }
      );
    }
    
    const ideaData = {
      title,
      summary,
      description,
      category,
      expected_impact: expected_impact || null,
      estimated_cost: estimated_cost || null,
      timeline: timeline || null,
      status: "open",
      author_id: user.uid,
      author: user.displayName || user.email,
      created_at: new Date(),
      updated_at: new Date(),
      supporters: 0,
      comments_count: 0,
    };
    
    const docRef = await adminDb.collection("ideas").add(ideaData);
    
    return NextResponse.json({
      idea: {
        id: docRef.id,
        ...ideaData,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ideas error:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
