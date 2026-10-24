import { describe, it, expect } from 'vitest';
import { appSchema } from './models';
import { createSeed } from './seed';
import { LocalDemoRepository, STORAGE_KEY } from './repository';
import {
  addBooking,
  changeFulfillment,
  createOrder,
  importProducts,
  overview,
  simulate,
  simulatedCustomerMessage,
  total,
  validateFlow,
} from './services';
import { runFlow } from './flow';

function memoryStorage(initial?: string) {
  let value = initial || null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}
describe('persistent business workflows', () => {
  it('persists changes across sessions without leaking records between businesses', () => {
    const storage = memoryStorage();
    const repo = new LocalDemoRepository(storage);
    repo.updateWorkspace((w) => {
      w.contacts[0].note = 'Nuudel only';
    });
    repo.transact((d) => {
      d.activeBusinessId = 'goo';
    });
    expect(repo.getSnapshot().workspaces.goo.contacts[0].note).toBe('');
    const restored = new LocalDemoRepository(storage);
    expect(restored.getSnapshot().activeBusinessId).toBe('goo');
    expect(restored.getSnapshot().workspaces.nuudel.contacts[0].note).toBe('Nuudel only');
    expect(appSchema.safeParse(restored.getSnapshot()).success).toBe(true);
  });
  it.each([
    '{bad json',
    JSON.stringify({ version: 99 }),
    JSON.stringify({ ...createSeed(), workspaces: {} }),
  ])('recovers malformed or unsupported data: %s', (saved) => {
    const repo = new LocalDemoRepository(memoryStorage(saved));
    expect(repo.recovery).toBeTruthy();
    expect(repo.getSnapshot().businesses).toHaveLength(2);
    expect(repo.getSnapshot().workspaces.nuudel.products.length).toBeGreaterThan(0);
  });
  it('does not commit changes when browser persistence fails', () => {
    const repo = new LocalDemoRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    const original = repo.getSnapshot();
    expect(() =>
      repo.updateWorkspace((w) => {
        w.orders = [];
      }),
    ).toThrow('storageError');
    expect(repo.getSnapshot()).toBe(original);
    expect(STORAGE_KEY).toBe('tuslah.demo.v1');
  });
  it('uses published business knowledge and live product data in Cyrillic and Latin, and refuses unknown facts', () => {
    const w = createSeed().workspaces.nuudel;
    expect(simulate(w, 'hurgelt').text).toContain('5,000₮');
    w.knowledge[0].content = 'Шинэ хүргэлтийн үнэ 8,000₮.';
    expect(simulate(w, 'Хүргэлт хэд вэ?').text).toContain('8,000₮');
    w.knowledge[0].published = false;
    expect(simulate(w, 'hurgelt').handoff).toBe(true);
    w.products[0].price = 88000;
    w.products[0].variants.forEach((v) => {
      v.stock = 0;
    });
    const answer = simulate(w, 'tsamts хэд вэ?');
    expect(answer.text).toContain('88,000₮');
    expect(answer.text).toContain('үлдэгдэлгүй');
    expect(simulate(w, 'Deliver to the Moon').handoff).toBe(true);
    expect(simulate(createSeed().workspaces.goo, 'Essential футболк').handoff).toBe(true);
  });
  it('keeps automation paused for customer messages until explicitly resumed, and respects disabled bots', () => {
    const w = createSeed().workspaces.nuudel;
    const c = w.conversations[0];
    const length = c.messages.length;
    c.human = true;
    simulatedCustomerMessage(w, c, 'hurgelt', 'mn');
    expect(c.messages).toHaveLength(length + 1);
    expect(c.messages.at(-1)?.role).toBe('customer');
    c.human = false;
    simulatedCustomerMessage(w, c, 'hurgelt', 'mn');
    expect(c.messages).toHaveLength(length + 3);
    expect(c.messages.at(-1)?.role).toBe('bot');
    w.bots[0].settings.automated = false;
    simulatedCustomerMessage(w, c, 'hurgelt', 'mn');
    expect(c.messages.at(-1)?.role).toBe('customer');
  });
  it('creates coherent order totals and customer history, snapshots item prices, and reserves/releases stock once', () => {
    const w = createSeed().workspaces.nuudel;
    const count = overview(w).orders;
    const stock = w.products[0].variants[0].stock;
    const order = createOrder(w, 'c1', 'p1', 'v1', 2, 'conv1');
    expect(total(order)).toBe(98000);
    expect(order.payment).toBe('unverified');
    expect(overview(w).orders).toBe(count + 1);
    expect(w.orders.filter((o) => o.contactId === 'c1' && o.conversationId === 'conv1')).toContain(
      order,
    );
    w.products[0].price = 99000;
    expect(total(order)).toBe(98000);
    changeFulfillment(w, order, 'confirmed');
    expect(w.products[0].variants[0].stock).toBe(stock - 2);
    changeFulfillment(w, order, 'shipped');
    expect(w.products[0].variants[0].stock).toBe(stock - 2);
    changeFulfillment(w, order, 'cancelled');
    expect(w.products[0].variants[0].stock).toBe(stock);
    expect(overview(w).orders).toBe(count);
    expect(() => createOrder(w, 'c1', 'p1', 'v1', stock + 1)).toThrow('insufficientStock');
  });
  it('rejects a stock race atomically when confirming multiple drafts', () => {
    const repo = new LocalDemoRepository(memoryStorage());
    let first = '',
      second = '';
    repo.updateWorkspace((w) => {
      w.products[0].variants[0].stock = 2;
      first = createOrder(w, 'c1', 'p1', 'v1', 2).id;
      second = createOrder(w, 'c2', 'p1', 'v1', 2).id;
      changeFulfillment(
        w,
        w.orders.find((o) => o.id === first)!,
        'confirmed',
      );
    });
    expect(() =>
      repo.updateWorkspace((w) =>
        changeFulfillment(
          w,
          w.orders.find((o) => o.id === second)!,
          'confirmed',
        ),
      ),
    ).toThrow('insufficientStock');
    const w = repo.getSnapshot().workspaces.nuudel;
    expect(w.orders.find((o) => o.id === second)?.fulfillment).toBe('draft');
    expect(w.products[0].variants[0].stock).toBe(0);
  });
  it('prevents overlapping active staff bookings, permits other staff, and frees cancelled slots', () => {
    const w = createSeed().workspaces.nuudel;
    const slot = new Date(Date.now() + 86400_000).toISOString();
    const booking = {
      id: 'b1',
      contactId: 'c1',
      staff: 'Номин',
      service: 'Зөвлөгөө',
      slot,
      cancelled: false,
    };
    addBooking(w, booking);
    expect(() => addBooking(w, { ...booking, id: 'b2' })).toThrow('bookingConflict');
    expect(() =>
      addBooking(w, {
        ...booking,
        id: 'b3',
        slot: new Date(Date.parse(slot) + 15 * 60000).toISOString(),
      }),
    ).toThrow('bookingConflict');
    addBooking(w, { ...booking, id: 'b4', staff: 'Саруул' });
    w.bookings[0].cancelled = true;
    addBooking(w, { ...booking, id: 'b5', cancelled: false });
    expect(w.bookings.filter((b) => !b.cancelled)).toHaveLength(2);
    expect(() => addBooking(w, { ...booking, slot: '2020-01-01T10:00:00+08:00' })).toThrow(
      'bookingInvalid',
    );
  });
  it('validates broken flows and previews the published copy independently of later draft changes', () => {
    const w = createSeed().workspaces.nuudel;
    const flow = w.bots[0].flow;
    expect(validateFlow(flow.draft)).toEqual([]);
    flow.published = structuredClone(flow.draft);
    flow.draft[1].text = 'UNPUBLISHED';
    const first = runFlow(w, flow.published, 'mn');
    expect(first.waiting).toBe(true);
    expect(first.messages.some((m) => m.text === 'UNPUBLISHED')).toBe(false);
    const result = runFlow(w, flow.published, 'mn', first, 'hurgelt');
    expect(result.ended).toBe(true);
    expect(result.messages.at(-1)?.text).toContain('5,000₮');
    flow.draft[0].next = 'missing';
    expect(validateFlow(flow.draft)).toContain('flowConnectionError');
    flow.draft.push({ ...flow.draft[0], id: 'start2' });
    expect(validateFlow(flow.draft)).toContain('flowStartError');
  });
  it('imports quoted CSV products and reports invalid rows without accepting negative stock or duplicate SKUs', () => {
    const parsed = importProducts(
      'name,category,price,size,color,sku,stock\n"Bag, canvas",Цүнх,35000,M,Beige,BAG1,5\nBad,Cat,3000,M,White,BAD,-1\nDuplicate,Cat,35000,M,White,BAG1,2',
    );
    expect(parsed.products).toHaveLength(1);
    expect(parsed.products[0].name).toBe('Bag, canvas');
    expect(parsed.errors).toHaveLength(2);
    expect(() => importProducts('Name,Price\nBag,100')).toThrow('csvHeader');
  });
});
