import { z } from 'zod';

export const languageSchema = z.enum(['mn', 'en']);
const channelSchema = z.enum(['messenger', 'instagram', 'web']);
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['customer', 'bot', 'staff', 'note']),
  text: z.string(),
  at: z.string(),
  productId: z.string().optional(),
});
export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  tags: z.array(z.string()),
  note: z.string(),
});
export const conversationSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  channel: channelSchema,
  source: z.enum(['DM', 'comment', 'ad']),
  status: z.enum(['open', 'resolved']),
  unread: z.number(),
  human: z.boolean(),
  assignee: z.string(),
  draft: z.string(),
  messages: z.array(messageSchema),
});
export const knowledgeSchema = z.object({
  id: z.string(),
  kind: z.enum(['faq', 'document', 'business']),
  title: z.string(),
  content: z.string(),
  keywords: z.string(),
  enabled: z.boolean(),
  published: z.boolean(),
});
export const variantSchema = z.object({
  id: z.string(),
  size: z.string(),
  color: z.string(),
  sku: z.string(),
  stock: z.number().int().nonnegative(),
});
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  keywords: z.string(),
  price: z.number().nonnegative(),
  art: z.enum(['shirt', 'bag', 'serum']),
  archived: z.boolean(),
  variants: z.array(variantSchema),
});
export const nodeTypes = ['start', 'message', 'question', 'condition', 'ai', 'handoff'] as const;
export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(nodeTypes),
  title: z.string(),
  text: z.string(),
  next: z.string(),
  alternate: z.string(),
  condition: z.string(),
});
export const flowSchema = z.object({
  draft: z.array(flowNodeSchema),
  published: z.array(flowNodeSchema).nullable(),
  publishedAt: z.string().nullable(),
});
export const botSettingsSchema = z.object({
  active: z.boolean(),
  automated: z.boolean(),
  typing: z.boolean(),
  greeting: z.string(),
  questions: z.array(z.object({ question: z.string(), answer: z.string() })),
  fallbackId: z.string(),
  persona: z.string(),
  menu: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['url', 'block']),
      target: z.string(),
    }),
  ),
});
export const botSchema = z.object({
  id: z.string(),
  name: z.string(),
  archived: z.boolean(),
  channel: channelSchema,
  updatedAt: z.string(),
  flow: flowSchema,
  settings: botSettingsSchema,
});
export const orderSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  conversationId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      name: z.string(),
      sku: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
    }),
  ),
  payment: z.enum(['unverified', 'simulated-paid']),
  fulfillment: z.enum(['draft', 'confirmed', 'shipped', 'completed', 'cancelled']),
  address: z.string(),
  phone: z.string(),
  assignee: z.string(),
  createdAt: z.string(),
  activity: z.array(z.object({ text: z.string(), at: z.string() })),
});
export const bookingSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  service: z.string(),
  staff: z.string(),
  slot: z.string(),
  cancelled: z.boolean(),
});
export const pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  published: z.object({ title: z.string(), slug: z.string(), content: z.string() }).nullable(),
});
export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email']),
  required: z.boolean(),
});
export const formSchema = z.object({
  id: z.string(),
  title: z.string(),
  fields: z.array(fieldSchema),
  responses: z.array(
    z.object({ id: z.string(), at: z.string(), values: z.record(z.string(), z.string()) }),
  ),
});
export const surveySchema = z.object({
  id: z.string(),
  title: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'choice']),
      options: z.array(z.string()),
    }),
  ),
  responses: z.array(
    z.object({ id: z.string(), at: z.string(), values: z.record(z.string(), z.string()) }),
  ),
});
export const businessSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  initials: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
});
export const workspaceSchema = z.object({
  selectedBotId: z.string(),
  bots: z.array(botSchema),
  contacts: z.array(contactSchema),
  conversations: z.array(conversationSchema),
  knowledge: z.array(knowledgeSchema),
  products: z.array(productSchema),
  orders: z.array(orderSchema),
  bookings: z.array(bookingSchema),
  pages: z.array(pageSchema),
  forms: z.array(formSchema),
  surveys: z.array(surveySchema),
  posts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      keyword: z.string(),
      reply: z.string(),
      enabled: z.boolean(),
    }),
  ),
  campaigns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      tag: z.string(),
      message: z.string(),
      updatedAt: z.string(),
    }),
  ),
  notifications: z.boolean(),
  replyBehavior: z.string(),
});
export const appSchema = z
  .object({
    version: z.literal(1),
    activeBusinessId: z.string(),
    language: languageSchema,
    businesses: z.array(businessSchema).min(1),
    workspaces: z.record(z.string(), workspaceSchema),
  })
  .superRefine((data, ctx) => {
    if (
      !data.businesses.some((b) => b.id === data.activeBusinessId) ||
      data.businesses.some((b) => !data.workspaces[b.id])
    ) {
      ctx.addIssue({ code: 'custom', message: 'Missing business workspace' });
    }
  });
export type Language = z.infer<typeof languageSchema>;
export type Business = z.infer<typeof businessSchema>;
export type Bot = z.infer<typeof botSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type KnowledgeEntry = z.infer<typeof knowledgeSchema>;
export type Product = z.infer<typeof productSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Flow = z.infer<typeof flowSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type AppData = z.infer<typeof appSchema>;
export interface Entitlement {
  key: string;
  tier: 'included' | 'pro' | 'addon';
}
