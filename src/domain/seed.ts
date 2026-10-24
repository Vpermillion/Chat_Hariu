import type { AppData, Bot, FlowNode, Workspace } from './models';

export function initialNodes(): FlowNode[] {
  return [
    {
      id: 'start',
      type: 'start',
      title: 'Эхлэл',
      text: '',
      next: 'welcome',
      alternate: '',
      condition: '',
    },
    {
      id: 'welcome',
      type: 'message',
      title: 'Мэндчилгээ',
      text: 'Сайн байна уу! Манай дэлгүүрт тавтай морилно уу ✨',
      next: 'ask',
      alternate: '',
      condition: '',
    },
    {
      id: 'ask',
      type: 'question',
      title: 'Танд хэрхэн туслах вэ?',
      text: 'Та ямар бараа сонирхож байна вэ?',
      next: 'answer',
      alternate: '',
      condition: '',
    },
    {
      id: 'answer',
      type: 'ai',
      title: 'Мэдлэгээс хариулах',
      text: '',
      next: '',
      alternate: '',
      condition: '',
    },
  ];
}
export function newBot(name: string, id: string, now = new Date().toISOString()): Bot {
  return {
    id,
    name,
    archived: false,
    channel: 'messenger',
    updatedAt: now,
    flow: { draft: initialNodes(), published: null, publishedAt: null },
    settings: {
      active: true,
      automated: true,
      typing: true,
      greeting: 'Сайн байна уу! Танд юугаар туслах вэ? ✨',
      questions: [
        {
          question: 'Хүргэлт хэд вэ?',
          answer: 'Хот дотор хүргэлт 5,000₮. 150,000₮-өөс дээш үнэгүй.',
        },
      ],
      fallbackId: 'answer',
      persona: 'Дэлгүүрийн туслах',
      menu: [],
    },
  };
}

function makeWorkspace(kind: 'clothing' | 'beauty', now: Date): Workspace {
  const beauty = kind === 'beauty';
  const at = (days: number, hour = 6) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(hour, 20, 0, 0);
    return d.toISOString();
  };
  const bot = newBot(beauty ? 'Гоо туслах' : 'Нүүдэл туслах', 'bot-1', at(0));
  const products: Workspace['products'] = beauty
    ? [
        {
          id: 'p1',
          name: 'Чийгшүүлэгч серум',
          category: 'Арьс арчилгаа',
          price: 59000,
          art: 'serum',
          description: 'Хөнгөн бүтэцтэй, өдөр тутмын чийгшүүлэх серум. 30 мл.',
          keywords: 'серум, serum, chiigshuulegch',
          archived: false,
          variants: [{ id: 'v1', size: '30 мл', color: 'Тунгалаг', sku: 'GOO-S30', stock: 18 }],
        },
        {
          id: 'p2',
          name: 'Арчилгааны цүнх',
          category: 'Дагалдах',
          price: 25000,
          art: 'bag',
          description: 'Өдөр тутмын хэрэглэлээ авч явах жижиг цүнх.',
          keywords: 'цүнх, tsunh, bag',
          archived: false,
          variants: [{ id: 'v2', size: 'Нэг хэмжээ', color: 'Шаргал', sku: 'GOO-B01', stock: 12 }],
        },
      ]
    : [
        {
          id: 'p1',
          name: 'Essential футболк',
          category: 'Футболк',
          price: 49000,
          art: 'shirt',
          description: '100% хөвөн даавуу. Өдөр бүрийн энгийн, тухтай сонголт.',
          keywords: 'футболк, tshirt, futbоlk, fut bolk, tsamts, цамц, essential',
          archived: false,
          variants: [
            { id: 'v1', size: 'M', color: 'Цагаан', sku: 'NUU-TEE-M', stock: 12 },
            { id: 'v2', size: 'L', color: 'Цагаан', sku: 'NUU-TEE-L', stock: 8 },
            { id: 'v3', size: 'S', color: 'Хар', sku: 'NUU-TEE-S', stock: 0 },
          ],
        },
        {
          id: 'p2',
          name: 'Өдөр бүрийн tote',
          category: 'Цүнх',
          price: 35000,
          art: 'bag',
          description: 'Бат бөх канвас даавуун цүнх. Бүх хэрэгтэй зүйлс тань багтана.',
          keywords: 'tote, цүнх, tsunh, bag',
          archived: false,
          variants: [{ id: 'v4', size: 'Нэг хэмжээ', color: 'Шаргал', sku: 'NUU-TOTE', stock: 16 }],
        },
        {
          id: 'p3',
          name: 'Relaxed футболк',
          category: 'Футболк',
          price: 59000,
          art: 'shirt',
          description: 'Сул загвар, зөөлөн даавуу. Амралтын өдрийн сонголт.',
          keywords: 'relaxed, сул, sul',
          archived: false,
          variants: [{ id: 'v5', size: 'L', color: 'Ногоон', sku: 'NUU-REL-L', stock: 6 }],
        },
      ];
  const names = beauty
    ? ['Энхзул', 'Уянга', 'Солонго', 'Халиун', 'Мөнхжин']
    : ['Анужин', 'Билгүүн', 'Номин', 'Энхжин', 'Тэмүүлэн', 'Саруул'];
  const contacts = names.map((name, i) => ({
    id: `c${i + 1}`,
    name,
    phone: `9900${String(1000 + i)}`,
    address: 'Улаанбаатар, Хан-Уул дүүрэг',
    tags: i % 2 ? ['Шинэ'] : ['Сонирхсон'],
    note: '',
  }));
  const questions = beauty
    ? [
        'Сайн уу, серум хэд вэ?',
        'Хүргэлттэй юу?',
        'Зөвлөгөө авч болох уу?',
        'Цүнх байгаа юу?',
        'Захиалга өгье',
      ]
    : [
        'Сайн уу! Энэ футболк L размер байгаа юу?',
        'Хүргэлт хэд вэ?',
        'Өчигдрийн захиалгаа асууя',
        'Tote цүнхний өнгө юу вэ?',
        'Захиалга өгмөөр байна',
        'Танайх хаана байдаг вэ?',
      ];
  const conversations: Workspace['conversations'] = contacts.map((c, i) => ({
    id: `conv${i + 1}`,
    contactId: c.id,
    channel: i % 3 === 1 ? 'instagram' : 'messenger',
    source: i % 3 === 0 ? 'DM' : i % 3 === 1 ? 'comment' : 'ad',
    status: i === 2 ? 'resolved' : 'open',
    unread: i === 0 || i === 3 ? 1 : 0,
    human: i === 2 || i === 4,
    assignee: i % 2 ? 'Тэмүүлэн' : 'Номин',
    draft: '',
    messages: [
      { id: `m${i}-1`, role: 'customer', text: questions[i], at: at(i % 3, 3 + i) },
      ...(i === 0
        ? [
            {
              id: 'm0-2',
              role: 'bot' as const,
              text: beauty
                ? 'Сайн байна уу! Чийгшүүлэгч серум 59,000₮. 30 мл хэмжээтэй.'
                : 'Сайн байна уу, Анужин! ✨ Essential футболк L размер бэлэн байна. Үнэ 49,000₮.',
              at: at(0, 3),
              productId: 'p1',
            },
            {
              id: 'm0-3',
              role: 'customer' as const,
              text: 'Гоё юм аа. Хүргэлтээр авч болох уу?',
              at: at(0, 4),
            },
          ]
        : []),
    ],
  }));
  const knowledge: Workspace['knowledge'] = [
    {
      id: 'k1',
      kind: 'faq',
      title: 'Хүргэлт хэд вэ?',
      content:
        'Хот дотор хүргэлт 5,000₮. 150,000₮-өөс дээш захиалгад үнэгүй. Хүргэлт 1–2 ажлын өдөр.',
      keywords: 'хүргэлт, hur gelt, hur gelt, hurgelt, delivery',
      enabled: true,
      published: true,
    },
    {
      id: 'k2',
      kind: 'faq',
      title: 'Ажиллах цаг',
      content: 'Даваа–Бямба 10:00–19:00, Ням 12:00–17:00. Улаанбаатарын цагаар.',
      keywords: 'цаг, ажиллах, tsag, ajillah, hours',
      enabled: true,
      published: true,
    },
    {
      id: 'k3',
      kind: 'faq',
      title: 'Бараа солих боломж',
      content:
        'Хэрэглээгүй, шошготой барааг 7 хоногийн дотор солиулж болно. Манай ажилтантай холбогдоорой.',
      keywords: 'солих, solih, return',
      enabled: true,
      published: false,
    },
    {
      id: 'k4',
      kind: 'business',
      title: 'Бизнесийн тухай',
      content: beauty
        ? 'Гоо студио — өдөр тутмын арьс арчилгааны дэлгүүр.'
        : 'Нүүдэл — өдөр тутмын энгийн, чанартай хувцас ба хэрэглэл.',
      keywords: 'тухай, тухайгаа, хаана, location',
      enabled: true,
      published: true,
    },
  ];
  return {
    selectedBotId: bot.id,
    bots: [bot],
    contacts,
    conversations,
    knowledge,
    products,
    orders: [0, 1, 2, 3].map((i) => ({
      id: `ORD-100${i + 1}`,
      contactId: contacts[i].id,
      conversationId: conversations[i].id,
      items: [
        {
          productId: products[i % 2].id,
          variantId: products[i % 2].variants[0].id,
          sku: products[i % 2].variants[0].sku,
          name: products[i % 2].name,
          quantity: 1,
          price: products[i % 2].price,
        },
      ],
      payment: i === 2 ? 'simulated-paid' : 'unverified',
      fulfillment: i === 2 ? 'completed' : i === 1 ? 'confirmed' : 'draft',
      address: contacts[i].address,
      phone: contacts[i].phone,
      assignee: 'Номин',
      createdAt: at(i),
      activity: [{ text: 'Демо захиалга үүссэн', at: at(i) }],
    })),
    bookings: [],
    pages: [
      {
        id: 'page1',
        title: 'Хүргэлт ба буцаалт',
        slug: 'delivery',
        content: 'Хот дотор хүргэлт 5,000₮. Дэлгэрэнгүйг манай ажилтнаас лавлаарай.',
        published: null,
      },
    ],
    forms: [
      {
        id: 'form1',
        title: 'Бидэнтэй холбогдох',
        fields: [
          { id: 'name', label: 'Нэр', type: 'text', required: true },
          { id: 'email', label: 'И-мэйл', type: 'email', required: true },
        ],
        responses: [],
      },
    ],
    surveys: [
      {
        id: 'survey1',
        title: 'Таны санал бидэнд чухал',
        questions: [
          {
            id: 'q1',
            label: 'Манай үйлчилгээг үнэлнэ үү',
            type: 'choice',
            options: ['Маш сайн', 'Сайн', 'Сайжруулах хэрэгтэй'],
          },
          { id: 'q2', label: 'Санал хүсэлт', type: 'text', options: [] },
        ],
        responses: [],
      },
    ],
    posts: [
      {
        id: 'post1',
        title: beauty ? 'Өдөр тутмын арчилгаа ✨' : 'Шинэ коллекц ирлээ ✨',
        keyword: 'үнэ',
        reply: 'Сайн байна уу! Та сонирхсон барааныхаа нэрийг бичээрэй. Дэлгэрэнгүй мэдээлэл өгье.',
        enabled: true,
      },
    ],
    campaigns: [],
    notifications: true,
    replyBehavior: 'Мэдээлэл тодорхойгүй бол ажилтанд шилжүүлэх.',
  };
}
export function createSeed(now = new Date()): AppData {
  return {
    version: 1,
    language: 'mn',
    activeBusinessId: 'nuudel',
    businesses: [
      {
        id: 'nuudel',
        name: 'Нүүдэл Store',
        category: 'Хувцас & хэрэглэл',
        initials: 'Н',
        email: '',
        phone: '',
        address: 'Улаанбаатар, Хан-Уул дүүрэг',
      },
      {
        id: 'goo',
        name: 'Гоо студио',
        category: 'Гоо сайхан',
        initials: 'Г',
        email: '',
        phone: '',
        address: 'Улаанбаатар, Сүхбаатар дүүрэг',
      },
    ],
    workspaces: { nuudel: makeWorkspace('clothing', now), goo: makeWorkspace('beauty', now) },
  };
}
