// Server integration boundaries. No browser credentials or fake Connected state.
import type { Business, Conversation, Order } from '../domain/models';
export type ConnectionState =
  'not-connected' | 'setup-required' | 'connected' | 'expired' | 'error';
export interface ServerSession {
  userId: string;
  businessId: string;
  expiresAt: string;
}
export interface WorkerApi {
  session(): Promise<ServerSession>;
  businesses(): Promise<Business[]>;
  conversations(businessId: string): Promise<Conversation[]>;
}
export interface D1Repository {
  listOrders(session: ServerSession): Promise<Order[]>;
}
export interface MetaChannelAdapter {
  status(businessId: string): Promise<{ state: ConnectionState; verifiedAt?: string }>;
  authorize(businessId: string): Promise<{ url: string }>;
}
export interface AiAdapter {
  reply(
    session: ServerSession,
    conversationId: string,
    message: string,
  ): Promise<{ text: string; sources: string[] }>;
}
export interface PaymentAdapter {
  createInvoice(session: ServerSession, orderId: string): Promise<{ id: string; url: string }>;
  verifiedStatus(session: ServerSession, invoiceId: string): Promise<'pending' | 'paid' | 'failed'>;
}
