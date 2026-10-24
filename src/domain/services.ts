import type {
  Booking,
  Conversation,
  FlowNode,
  Language,
  Order,
  Product,
  Workspace,
} from './models';

export const uid = () => crypto.randomUUID();
export const total = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const money = (amount: number) => `${new Intl.NumberFormat('en-US').format(amount)}₮`;
export const businessDate = (iso: string, language: Language = 'mn', time = false) =>
  new Intl.DateTimeFormat(language === 'mn' ? 'mn-MN' : 'en-GB', {
    timeZone: 'Asia/Ulaanbaatar',
    month: 'short',
    day: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(iso));
export const normalize = (text: string) =>
  text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export function simulate(
  workspace: Workspace,
  query: string,
  language: Language = 'mn',
): { text: string; productId?: string; handoff: boolean } {
  const q = normalize(query);
  const matched = (title: string, keys: string) => {
    const candidates = [title, ...keys.split(',')].map(normalize).filter(Boolean);
    return candidates.some((key) => q.includes(key) || (q.length > 2 && key.includes(q)));
  };
  const product = workspace.products.find((p) => !p.archived && matched(p.name, p.keywords));
  if (product) {
    const available = product.variants.filter((v) => v.stock > 0);
    return {
      text:
        language === 'mn'
          ? `${product.name} — ${money(product.price)}. ${product.description} ${available.length ? `Бэлэн: ${available.map((v) => `${v.size} / ${v.color} (${v.stock})`).join(', ')}.` : 'Одоогоор үлдэгдэлгүй.'}`
          : `${product.name} — ${money(product.price)}. ${product.description} ${available.length ? `In stock: ${available.map((v) => `${v.size} / ${v.color} (${v.stock})`).join(', ')}.` : 'Currently out of stock.'}`,
      productId: product.id,
      handoff: false,
    };
  }
  const entry = workspace.knowledge.find(
    (k) => k.enabled && k.published && matched(k.title, k.keywords),
  );
  if (entry) return { text: entry.content, handoff: false };
  return {
    text:
      language === 'mn'
        ? 'Энэ талаар баталгаатай мэдээлэл алга. Та асуултаа тодруулна уу, эсвэл манай ажилтантай холбогдоорой.'
        : 'I do not have confirmed information about that. Please clarify your question or ask a team member.',
    handoff: true,
  };
}

export function reply(
  workspace: Workspace,
  conversationId: string,
  text: string,
  role: 'staff' | 'note',
  productId?: string,
) {
  const conversation = workspace.conversations.find((c) => c.id === conversationId);
  if (!conversation || (!text.trim() && !productId)) throw new Error('invalidReply');
  conversation.messages.push({
    id: uid(),
    text: text.trim(),
    role,
    at: new Date().toISOString(),
    ...(productId ? { productId } : {}),
  });
  conversation.draft = '';
}
export function simulatedCustomerMessage(
  workspace: Workspace,
  conversation: Conversation,
  text: string,
  language: Language,
) {
  if (!text.trim()) throw new Error('required');
  const at = new Date().toISOString();
  conversation.messages.push({ id: uid(), role: 'customer', text: text.trim(), at });
  const bot = workspace.bots.find((b) => b.id === workspace.selectedBotId && !b.archived);
  if (
    !conversation.human &&
    bot?.settings.active &&
    bot.settings.automated &&
    conversation.status === 'open'
  ) {
    const answer = simulate(workspace, text, language);
    conversation.messages.push({
      id: uid(),
      role: 'bot',
      text: answer.text,
      at,
      ...(answer.productId ? { productId: answer.productId } : {}),
    });
    if (answer.handoff) conversation.human = true;
  }
}

export function createOrder(
  workspace: Workspace,
  contactId: string,
  productId: string,
  variantId: string,
  quantity: number,
  conversationId?: string,
): Order {
  const contact = workspace.contacts.find((c) => c.id === contactId);
  const product = workspace.products.find((p) => p.id === productId && !p.archived);
  const variant = product?.variants.find((v) => v.id === variantId);
  if (!contact || !product || !variant || !Number.isInteger(quantity) || quantity < 1)
    throw new Error('invalidOrder');
  if (quantity > variant.stock) throw new Error('insufficientStock');
  const now = new Date().toISOString();
  const order: Order = {
    id: `ORD-${uid().slice(0, 8).toUpperCase()}`,
    contactId,
    ...(conversationId ? { conversationId } : {}),
    items: [
      {
        productId,
        variantId,
        name: product.name,
        sku: variant.sku,
        quantity,
        price: product.price,
      },
    ],
    payment: 'unverified',
    fulfillment: 'draft',
    address: contact.address,
    phone: contact.phone,
    assignee: 'Номин',
    createdAt: now,
    activity: [{ text: 'Захиалгын ноорог үүссэн / Order draft created', at: now }],
  };
  workspace.orders.unshift(order);
  return order;
}
export function changeFulfillment(workspace: Workspace, order: Order, next: Order['fulfillment']) {
  const reserves = (status: Order['fulfillment']) => !['draft', 'cancelled'].includes(status);
  const previous = reserves(order.fulfillment);
  const following = reserves(next);
  if (!previous && following) {
    for (const item of order.items) {
      const product = workspace.products.find((p) => p.id === item.productId && !p.archived);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity) throw new Error('insufficientStock');
    }
  }
  if (previous !== following)
    for (const item of order.items) {
      const variant = workspace.products
        .find((p) => p.id === item.productId)
        ?.variants.find((v) => v.id === item.variantId);
      if (variant) variant.stock += following ? -item.quantity : item.quantity;
    }
  order.fulfillment = next;
  order.activity.push({ text: `Төлөв / Status: ${next}`, at: new Date().toISOString() });
}

export function validateProduct(product: Product): string | null {
  if (
    !product.name.trim() ||
    !product.category.trim() ||
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !product.variants.length
  )
    return 'productInvalid';
  if (
    product.variants.some(
      (v) => !v.sku.trim() || !v.size.trim() || !Number.isInteger(v.stock) || v.stock < 0,
    )
  )
    return 'variantInvalid';
  if (new Set(product.variants.map((v) => v.sku.toLowerCase())).size !== product.variants.length)
    return 'duplicateSku';
  return null;
}
export function validateFlow(nodes: FlowNode[]): string[] {
  const errors: string[] = [];
  const starts = nodes.filter((n) => n.type === 'start');
  if (starts.length !== 1) errors.push('flowStartError');
  if (new Set(nodes.map((n) => n.id)).size !== nodes.length) errors.push('flowConnectionError');
  for (const node of nodes) {
    if (
      !node.title.trim() ||
      (['message', 'question'].includes(node.type) && !node.text.trim()) ||
      (node.type === 'condition' && !node.condition.trim())
    )
      errors.push('flowFieldError');
    if (
      (node.next && !nodes.some((n) => n.id === node.next)) ||
      (node.alternate && !nodes.some((n) => n.id === node.alternate)) ||
      (['start', 'question', 'condition'].includes(node.type) && !node.next) ||
      (node.type === 'condition' && !node.alternate)
    )
      errors.push('flowConnectionError');
  }
  const visited = new Set<string>();
  const walk = (id: string) => {
    if (!id || visited.has(id)) return;
    visited.add(id);
    const n = nodes.find((n) => n.id === id);
    if (n) {
      walk(n.next);
      walk(n.alternate);
    }
  };
  if (starts[0]) walk(starts[0].id);
  if (nodes.some((n) => !visited.has(n.id))) errors.push('flowUnreachable');
  return [...new Set(errors)];
}

export function addBooking(workspace: Workspace, booking: Booking) {
  if (
    !workspace.contacts.some((c) => c.id === booking.contactId) ||
    !booking.staff ||
    !booking.service ||
    !Number.isFinite(Date.parse(booking.slot)) ||
    Date.parse(booking.slot) <= Date.now()
  )
    throw new Error('bookingInvalid');
  if (
    workspace.bookings.some(
      (b) =>
        !b.cancelled &&
        b.staff === booking.staff &&
        Math.abs(Date.parse(b.slot) - Date.parse(booking.slot)) < 30 * 60 * 1000,
    )
  )
    throw new Error('bookingConflict');
  workspace.bookings.push(booking);
}

export function overview(workspace: Workspace) {
  return {
    conversations: workspace.conversations.length,
    unanswered: workspace.conversations.filter(
      (c) =>
        c.status === 'open' &&
        c.messages.filter((m) => m.role !== 'note').at(-1)?.role === 'customer',
    ).length,
    handoffs: workspace.conversations.filter((c) => c.human && c.status === 'open').length,
    orders: workspace.orders.filter((o) => o.fulfillment !== 'cancelled').length,
  };
}

// RFC 4180 quoted cells, including embedded commas/newlines, are supported.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' && !quoted) {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r' || quoted) cell += char;
  }
  if (quoted) throw new Error('csvInvalid');
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function importProducts(input: string): { products: Product[]; errors: string[] } {
  const rows = parseCsv(input);
  if (rows[0]?.join(',') !== 'name,category,price,size,color,sku,stock')
    throw new Error('csvHeader');
  const products: Product[] = [];
  const errors: string[] = [];
  const skus = new Set<string>();
  for (const [index, row] of rows.slice(1).entries()) {
    const [name, category, price, size, color, sku, stock] = row;
    const product: Product = {
      id: uid(),
      name: name || '',
      category: category || '',
      price: Number(price),
      art: 'shirt',
      description: '',
      keywords: name || '',
      archived: false,
      variants: [
        { id: uid(), size: size || '', color: color || '', sku: sku || '', stock: Number(stock) },
      ],
    };
    const invalid =
      row.length !== 7 ||
      !price ||
      !stock ||
      validateProduct(product) ||
      skus.has((sku || '').toLowerCase());
    if (invalid) errors.push(`${index + 2}: ${sku || '—'}`);
    else {
      products.push(product);
      skus.add(sku.toLowerCase());
    }
  }
  return { products, errors };
}
