import type { Entitlement } from './domain/models';
export const brand = {
  name: 'Туслах',
  latinName: 'Tuslah',
  tagline: 'Бизнесийн тань шинэ туслах',
  logo: `${import.meta.env.BASE_URL}logo.svg`,
  contactEmail: '',
  contactPhone: '',
  theme: { primary: '#315cfd', success: '#158775', warning: '#b77914', danger: '#ce4357' },
  plans: [
    {
      id: 'start',
      name: ['Эхлэл', 'Starter'],
      description: ['Харилцан яриагаа нэг дор', 'Your conversations, together'],
      features: ['inbox', 'bots', 'knowledge'],
      featured: false,
    },
    {
      id: 'grow',
      name: ['Өсөлт', 'Growth'],
      description: ['Ярианаас захиалга хүртэл', 'From conversations to orders'],
      features: ['inbox', 'knowledge', 'products', 'orders', 'analytics'],
      featured: true,
    },
    {
      id: 'team',
      name: ['Баг', 'Team'],
      description: ['Багтайгаа хамт илүү хол', 'Go further with your team'],
      features: ['inbox', 'live-agent', 'forms', 'surveys', 'bookings'],
      featured: false,
    },
  ],
};
export const entitlements: Entitlement[] = [
  ...[
    'inbox',
    'bots',
    'knowledge',
    'products',
    'flows',
    'contacts',
    'settings',
    'channels',
    'messaging',
    'billing',
  ].map((key) => ({ key, tier: 'included' as const })),
  ...['orders', 'pages', 'forms', 'surveys', 'analytics'].map((key) => ({
    key,
    tier: 'pro' as const,
  })),
  ...['live-agent', 'posts', 'bookings'].map((key) => ({ key, tier: 'addon' as const })),
];
export const staff = ['Номин', 'Тэмүүлэн', 'Саруул'];
export const services = ['Зөвлөгөө · 30 мин', 'Бараа үзэх · 30 мин', 'Арьс арчилгаа · 30 мин'];
