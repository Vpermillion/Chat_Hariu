import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  ShoppingBag,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../store';
import {
  PageHeader,
  Button,
  Badge,
  SearchInput,
  Empty,
  Modal,
  Field,
  ProductArt,
  IconButton,
  Avatar,
} from '../components/ui';
import {
  businessDate,
  money,
  total,
  uid,
  validateProduct,
  importProducts,
  createOrder,
  changeFulfillment,
} from '../domain/services';
import type { Product, Order } from '../domain/models';
import { staff } from '../config';

export function ProductsPage() {
  const { w, repo, t, run } = useStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('all');
  const [edit, setEdit] = useState<Product | null>(null);
  const [csv, setCsv] = useState(false);
  const products = w.products.filter(
    (p) =>
      (status === 'all' || p.archived === (status === 'archived')) &&
      (category === 'all' || p.category === category) &&
      `${p.name} ${p.variants.map((v) => v.sku).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title={t('Products')}
        subtitle={t('Your products. Their next favorite.')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCsv(true)}>
              <Upload size={16} />
              {t('Import CSV')}
            </Button>
            <Button
              onClick={() =>
                setEdit({
                  id: uid(),
                  name: '',
                  category: '',
                  description: '',
                  price: 0,
                  keywords: '',
                  art: 'shirt',
                  archived: false,
                  variants: [{ id: uid(), size: 'M', color: '', sku: '', stock: 0 }],
                })
              }
            >
              <Plus size={17} />
              {t('Add product')}
            </Button>
          </>
        }
      />
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('Search products')} />
        <select
          aria-label={t('Category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">
            {t('All')} · {t('Category')}
          </option>
          {[...new Set(w.products.map((p) => p.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label={t('Status')} value={status} onChange={(e) => setStatus(e.target.value)}>
          {['active', 'archived', 'all'].map((s) => (
            <option key={s} value={s}>
              {t(s === 'active' ? 'Active' : s === 'archived' ? 'Archived' : 'All')}
            </option>
          ))}
        </select>
        <span className="toolbar-count">
          {products.length} {t('Products')}
        </span>
      </div>
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button className="table-product" onClick={() => setEdit(structuredClone(p))}>
                      <ProductArt art={p.art} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.variants.length} {t('Variants')} · {p.variants[0]?.sku}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>{p.category}</td>
                  <td className="nowrap">
                    <strong>{money(p.price)}</strong>
                  </td>
                  <td>
                    <span
                      className={p.variants.reduce((s, v) => s + v.stock, 0) ? '' : 'text-danger'}
                    >
                      {p.variants.reduce((s, v) => s + v.stock, 0)}
                    </span>
                  </td>
                  <td>
                    <Badge tone={p.archived ? 'neutral' : 'green'}>
                      {t(p.archived ? 'Archived' : 'Active')}
                    </Badge>
                  </td>
                  <td>
                    <div className="row-actions">
                      <IconButton label={t('Edit')} onClick={() => setEdit(structuredClone(p))}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        label={t(p.archived ? 'Restore' : 'Archive')}
                        onClick={() =>
                          run(() =>
                            repo.updateWorkspace((s) => {
                              s.products.find((v) => v.id === p.id)!.archived = !p.archived;
                            }),
                          )
                        }
                      >
                        {p.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && <Empty />}
      </section>
      {edit && <ProductEditor product={edit} onClose={() => setEdit(null)} />}
      {csv && <CsvImport onClose={() => setCsv(false)} />}
    </>
  );
}
function ProductEditor({ product, onClose }: { product: Product; onClose: () => void }) {
  const { w, repo, t, run, notify } = useStore();
  const [draft, setDraft] = useState(product);
  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateProduct(draft);
    if (error) return notify(error, true);
    const skus = new Set(
      w.products
        .filter((p) => p.id !== draft.id)
        .flatMap((p) => p.variants.map((v) => v.sku.toLowerCase())),
    );
    if (draft.variants.some((v) => skus.has(v.sku.toLowerCase())))
      return notify('duplicateSku', true);
    if (
      run(() =>
        repo.updateWorkspace((s) => {
          const index = s.products.findIndex((p) => p.id === draft.id);
          if (index >= 0) s.products[index] = draft;
          else s.products.push(draft);
        }),
      )
    )
      onClose();
  };
  return (
    <Modal
      title={t(w.products.some((p) => p.id === product.id) ? 'Edit' : 'Add product')}
      onClose={onClose}
      wide
    >
      <form onSubmit={save}>
        <div className="product-editor-grid">
          <div>
            <Field label={t('Name')}>
              <input required value={draft.name} onChange={(e) => update('name', e.target.value)} />
            </Field>
            <div className="form-grid">
              <Field label={t('Category')}>
                <input
                  required
                  value={draft.category}
                  onChange={(e) => update('category', e.target.value)}
                />
              </Field>
              <Field label={`${t('Price')} · ₮`}>
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.price || ''}
                  onChange={(e) => update('price', Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label={t('Description')}>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </Field>
            <Field
              label={t('Keywords')}
              help={t(
                'Separate matching phrases with commas. Cyrillic and Latin keywords are supported.',
              )}
            >
              <input value={draft.keywords} onChange={(e) => update('keywords', e.target.value)} />
            </Field>
          </div>
          <div className="product-preview">
            <small>{t('Product preview')}</small>
            <ProductArt art={draft.art} />
            <strong>{draft.name || t('New product')}</strong>
            <span>{money(draft.price)}</span>
            <Field label={t('Product')}>
              <select
                value={draft.art}
                onChange={(e) => update('art', e.target.value as Product['art'])}
              >
                <option value="shirt">{t('Clothing')}</option>
                <option value="bag">{t('Products')} · tote</option>
                <option value="serum">{t('Beauty')}</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="section-title">
          <h3>{t('Variants')}</h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              update('variants', [
                ...draft.variants,
                { id: uid(), size: '', color: '', sku: '', stock: 0 },
              ])
            }
          >
            <Plus size={15} />
            {t('Add variant')}
          </Button>
        </div>
        <div className="variants-list">
          {draft.variants.map((v, i) => (
            <div className="variant-row" key={v.id}>
              {(['size', 'color', 'sku', 'stock'] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    key === 'sku'
                      ? 'SKU'
                      : t(key === 'size' ? 'Size' : key === 'color' ? 'Color' : 'Stock')
                  }
                >
                  <input
                    required={key !== 'color'}
                    type={key === 'stock' ? 'number' : 'text'}
                    min={key === 'stock' ? 0 : undefined}
                    step={key === 'stock' ? 1 : undefined}
                    value={v[key]}
                    onChange={(e) =>
                      update(
                        'variants',
                        draft.variants.map((variant, index) =>
                          index === i
                            ? {
                                ...variant,
                                [key]: key === 'stock' ? Number(e.target.value) : e.target.value,
                              }
                            : variant,
                        ),
                      )
                    }
                  />
                </Field>
              ))}
              <IconButton
                type="button"
                label={t('Delete')}
                disabled={draft.variants.length === 1}
                onClick={() =>
                  update(
                    'variants',
                    draft.variants.filter((_, index) => i !== index),
                  )
                }
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit">
            <Check size={16} />
            {t('Save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function CsvImport({ onClose }: { onClose: () => void }) {
  const { w, repo, t, run, notify } = useStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof importProducts> | null>(null);
  const sample =
    'name,category,price,size,color,sku,stock\nCanvas tote,Цүнх,35000,One size,Beige,TOTE-NEW,10\n';
  const preview = () => {
    try {
      const parsed = importProducts(text);
      const existing = new Set(
        w.products.flatMap((p) => p.variants.map((v) => v.sku.toLowerCase())),
      );
      const collisions = parsed.products.filter((p) =>
        existing.has(p.variants[0].sku.toLowerCase()),
      );
      setResult({
        products: parsed.products.filter((p) => !existing.has(p.variants[0].sku.toLowerCase())),
        errors: [...parsed.errors, ...collisions.map((p) => `SKU: ${p.variants[0].sku}`)],
      });
    } catch (e) {
      notify((e as Error).message, true);
    }
  };
  return (
    <Modal title={t('Import CSV')} onClose={onClose} wide>
      <p className="muted">
        {t(
          'CSV: name,category,price,size,color,sku,stock. Prices in MNT. One variant per imported product.',
        )}
      </p>
      <div className="toolbar">
        <a
          className="button button-secondary"
          download="tuslah-products-sample.csv"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`}
        >
          <Download size={15} />
          {t('Download sample')}
        </a>
        <Field label={t('Import CSV')}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 1_000_000) return notify('required', true);
                setText(await f.text());
                setResult(null);
              }
            }}
          />
        </Field>
      </div>
      <Field label="CSV">
        <textarea
          rows={7}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          placeholder={sample}
        />
      </Field>
      <Button variant="secondary" onClick={preview}>
        {t('Preview import')}
      </Button>
      {result && (
        <div className="import-result">
          <h3>
            {t('Ready to import')}: {result.products.length}
          </h3>
          {result.errors.length > 0 && (
            <div className="inline-error">
              <strong>{t('Row errors')}</strong>
              <ul>
                {result.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('Name')}</th>
                  <th>{t('Price')}</th>
                  <th>SKU</th>
                  <th>{t('Stock')}</th>
                </tr>
              </thead>
              <tbody>
                {result.products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{money(p.price)}</td>
                    <td>{p.variants[0].sku}</td>
                    <td>{p.variants[0].stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <Button
              disabled={!result.products.length}
              onClick={() => {
                if (
                  run(() =>
                    repo.updateWorkspace((s) => {
                      s.products.push(...result.products);
                    }),
                  )
                )
                  onClose();
              }}
            >
              {t('Import valid rows')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function CreateOrderModal({
  contactId,
  conversationId,
  onClose,
  onCreated,
}: {
  contactId?: string;
  conversationId?: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { w, repo, t, run } = useStore();
  const products = w.products.filter((p) => !p.archived);
  const [customer, setCustomer] = useState(contactId || w.contacts[0]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const product = products.find((p) => p.id === productId);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  return (
    <Modal title={t('Create order draft')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          let id = '';
          if (
            run(
              () =>
                repo.updateWorkspace((s) => {
                  id = createOrder(s, customer, productId, variantId, quantity, conversationId).id;
                }),
              'Order created',
            )
          ) {
            onCreated?.(id);
            onClose();
          }
        }}
      >
        <Field label={t('Customer')}>
          <select required value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {w.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Select product')}>
          <select
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariantId(products.find((p) => p.id === e.target.value)?.variants[0]?.id || '');
            }}
          >
            {!products.length && <option value="">—</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {money(p.price)}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label={t('Select variant')}>
            <select required value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {product?.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size} / {v.color} · {t('Stock')}: {v.stock}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Quantity')}>
            <input
              required
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="order-total">
          <span>{t('Total')}</span>
          <strong>{money((product?.price || 0) * quantity)}</strong>
        </div>
        <p className="small muted">
          {t('All messages here are local demo records. Nothing is delivered to a social network.')}
        </p>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={!products.length}>
            <ShoppingBag size={16} />
            {t('Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export const fulfillmentLabel: Record<Order['fulfillment'], string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
export function OrdersPage() {
  const { w, t, data } = useStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [params, setParams] = useSearchParams();
  const [create, setCreate] = useState(false);
  const selected = w.orders.find((o) => o.id === params.get('order'));
  const orders = w.orders.filter(
    (o) =>
      `${o.id} ${w.contacts.find((c) => c.id === o.contactId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'all' || o.fulfillment === status) &&
      (payment === 'all' || o.payment === payment),
  );
  return (
    <>
      <PageHeader
        title={t('Orders')}
        subtitle={t('A clear path from hello to order.')}
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={17} />
            {t('New order')}
          </Button>
        }
      />
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('Search orders')} />
        <select
          aria-label={t('Fulfillment')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">{t('All statuses')}</option>
          {Object.entries(fulfillmentLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {t(label)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('Payment')}
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
        >
          <option value="all">
            {t('All')} · {t('Payment')}
          </option>
          <option value="unverified">{t('Unverified')}</option>
          <option value="simulated-paid">{t('Simulated paid')}</option>
        </select>
        <span className="toolbar-count">
          {orders.length} {t('Orders')}
        </span>
      </div>
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  'Order',
                  'Customer',
                  'Total',
                  'Payment',
                  'Fulfillment',
                  'Date',
                  'Assigned to',
                ].map((h) => (
                  <th key={h}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button className="table-link" onClick={() => setParams({ order: o.id })}>
                      {o.id}
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                  <td>
                    <span className="inline-person">
                      <Avatar
                        name={w.contacts.find((c) => c.id === o.contactId)?.name || ''}
                        size="small"
                      />
                      {w.contacts.find((c) => c.id === o.contactId)?.name}
                    </span>
                  </td>
                  <td className="nowrap">
                    <strong>{money(total(o))}</strong>
                  </td>
                  <td>
                    <Badge tone={o.payment === 'unverified' ? 'amber' : 'green'}>
                      {t(o.payment === 'unverified' ? 'Unverified' : 'Simulated paid')}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        o.fulfillment === 'completed'
                          ? 'green'
                          : o.fulfillment === 'cancelled'
                            ? 'red'
                            : 'neutral'
                      }
                    >
                      {t(fulfillmentLabel[o.fulfillment])}
                    </Badge>
                  </td>
                  <td className="nowrap">{businessDate(o.createdAt, data.language)}</td>
                  <td>{o.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && <Empty />}
      </section>
      {create && (
        <CreateOrderModal
          onClose={() => setCreate(false)}
          onCreated={(id) => setParams({ order: id })}
        />
      )}
      {selected && <OrderDetail key={selected.id} order={selected} onClose={() => setParams({})} />}
    </>
  );
}
function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { w, t, data, run, repo } = useStore();
  const contact = w.contacts.find((c) => c.id === order.contactId)!;
  const [address, setAddress] = useState(order.address);
  const [phone, setPhone] = useState(order.phone);
  const [payment, setPayment] = useState(false);
  return (
    <Modal title={order.id} onClose={onClose} wide>
      <div className="order-detail-heading">
        <span className="inline-person">
          <Avatar name={contact.name} />
          {contact.name}
        </span>
        <Badge tone="amber">{t('Local demo')}</Badge>
        <span className="muted">{businessDate(order.createdAt, data.language, true)}</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {['Product', 'Quantity', 'Price', 'Total'].map((h) => (
                <th key={h}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <strong>{item.name}</strong>
                  <small className="block muted">{item.sku}</small>
                </td>
                <td>{item.quantity}</td>
                <td>{money(item.price)}</td>
                <td>{money(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="order-total">
        <span>{t('Total')}</span>
        <strong>{money(total(order))}</strong>
      </div>
      <div className="form-grid">
        <Field label={t('Fulfillment')}>
          <select
            value={order.fulfillment}
            onChange={(e) =>
              run(() =>
                repo.updateWorkspace((s) =>
                  changeFulfillment(
                    s,
                    s.orders.find((o) => o.id === order.id)!,
                    e.target.value as Order['fulfillment'],
                  ),
                ),
              )
            }
          >
            {Object.entries(fulfillmentLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Assigned to')}>
          <select
            value={order.assignee}
            onChange={(e) =>
              run(() =>
                repo.updateWorkspace((s) => {
                  s.orders.find((o) => o.id === order.id)!.assignee = e.target.value;
                }),
              )
            }
          >
            {staff.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="payment-panel">
        <span>
          <small>{t('Payment')}</small>
          <Badge tone={order.payment === 'unverified' ? 'amber' : 'green'}>
            {t(order.payment === 'unverified' ? 'Unverified' : 'Simulated paid')}
          </Badge>
        </span>
        <Button
          variant="secondary"
          disabled={order.payment === 'simulated-paid'}
          onClick={() => setPayment(true)}
        >
          {t('Simulate payment')}
        </Button>
      </div>
      {payment && (
        <div className="inline-confirm" role="region" aria-label={t('Payment simulation')}>
          <strong>{t('Payment simulation')}</strong>
          <p>{t('This changes a demo record only. No money moves and no payment is verified.')}</p>
          <div className="row-actions">
            <Button variant="secondary" onClick={() => setPayment(false)}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={() => {
                if (
                  run(() =>
                    repo.updateWorkspace((s) => {
                      const o = s.orders.find((o) => o.id === order.id)!;
                      o.payment = 'simulated-paid';
                      o.activity.push({
                        text: 'Демо төлбөр / Simulated payment',
                        at: new Date().toISOString(),
                      });
                    }),
                  )
                )
                  setPayment(false);
              }}
            >
              {t('Simulate payment')}
            </Button>
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() =>
            repo.updateWorkspace((s) => {
              const o = s.orders.find((o) => o.id === order.id)!;
              o.address = address.trim();
              o.phone = phone.trim();
              o.activity.push({
                text: 'Хүргэлтийн мэдээлэл / Delivery details updated',
                at: new Date().toISOString(),
              });
              const c = s.contacts.find((c) => c.id === o.contactId)!;
              c.address = address.trim();
              c.phone = phone.trim();
            }),
          );
        }}
      >
        <h3>{t('Delivery information')}</h3>
        <div className="form-grid">
          <Field label={t('Address')}>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label={t('Phone')}>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" variant="secondary">
          {t('Save')}
        </Button>
      </form>
      <h3 className="section-spacer">{t('Activity')}</h3>
      <ol className="activity-list">
        {order.activity
          .slice()
          .reverse()
          .map((a, i) => (
            <li key={i}>
              <span />
              <div>
                {a.text}
                <small>{businessDate(a.at, data.language, true)}</small>
              </div>
            </li>
          ))}
      </ol>
    </Modal>
  );
}
