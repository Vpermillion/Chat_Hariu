import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CalendarDays,
  Check,
  Save,
  Sparkles,
  Send,
  Megaphone,
  Trash2,
  ClipboardList,
  MessagesSquare,
  BookOpen,
  Bot,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Field,
  MessageBubble,
  Modal,
  PageHeader,
  SearchInput,
  Toggle,
  IconButton,
} from '../components/ui';
import { addBooking, businessDate, money, normalize, total, uid } from '../domain/services';
import { staff, services } from '../config';
import type { Workspace } from '../domain/models';
import { PricingCards } from './Marketing';
import { ActivityChart } from './OverviewBots';
import { useUnsaved } from '../hooks';

const ulaanbaatarDay = (date = new Date()) =>
  new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
export function BookingsPage() {
  const { w, t, repo, run, data } = useStore();
  const [day, setDay] = useState(ulaanbaatarDay(new Date(Date.now() + 86400_000)));
  const [person, setPerson] = useState(staff[0]);
  const [service, setService] = useState(services[0]);
  const [contact, setContact] = useState(w.contacts[0]?.id || '');
  const [time, setTime] = useState('10:00');
  const [filter, setFilter] = useState('active');
  const slots = Array.from(
    { length: 16 },
    (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  );
  const slotIso = (slot: string) => new Date(`${day}T${slot}:00+08:00`).toISOString();
  return (
    <>
      <PageHeader
        title={t('Bookings')}
        subtitle={t('Ulaanbaatar time (UTC+8)')}
        actions={
          <Badge tone="blue">
            {w.bookings.filter((b) => !b.cancelled).length} {t('Active')}
          </Badge>
        }
      />
      <div className="booking-layout">
        <section className="panel settings-panel">
          <h2>
            <CalendarDays size={20} />
            {t('New booking')}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  repo.updateWorkspace((s) =>
                    addBooking(s, {
                      id: uid(),
                      contactId: contact,
                      staff: person,
                      service,
                      slot: slotIso(time),
                      cancelled: false,
                    }),
                  ),
                'Booking saved',
              );
            }}
          >
            <div className="form-grid">
              <Field label={t('Customer')}>
                <select required value={contact} onChange={(e) => setContact(e.target.value)}>
                  {w.contacts.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Service')}>
                <select value={service} onChange={(e) => setService(e.target.value)}>
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label={t('Staff')}>
                <select value={person} onChange={(e) => setPerson(e.target.value)}>
                  {staff.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('Select a date')}>
                <input
                  type="date"
                  required
                  min={ulaanbaatarDay()}
                  value={day}
                  onChange={(e) => {
                    if (e.target.value) setDay(e.target.value);
                  }}
                />
              </Field>
            </div>
            <h3>{t('Available slots')}</h3>
            <div className="booking-slots" role="group" aria-label={t('Time')}>
              {slots.map((slot) => {
                const booked = w.bookings.some(
                  (b) => !b.cancelled && b.staff === person && b.slot === slotIso(slot),
                );
                return (
                  <button
                    type="button"
                    aria-pressed={time === slot}
                    disabled={Date.parse(slotIso(slot)) <= Date.now()}
                    key={slot}
                    className={`${time === slot ? 'selected' : ''} ${booked ? 'booked' : ''}`}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                    <small>{booked ? t('Booked') : '30 min'}</small>
                  </button>
                );
              })}
            </div>
            <p className="small muted">
              {t('Ulaanbaatar time (UTC+8)')} · {t('Local demo')}
            </p>
            <Button type="submit">
              <Check size={15} />
              {t('New booking')}
            </Button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="section-title">
            <h2>{t('Bookings')}</h2>
            <select
              aria-label={t('Status')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="active">{t('Active')}</option>
              <option value="all">{t('All')}</option>
            </select>
          </div>
          <div className="booking-records">
            {w.bookings
              .filter((b) => filter === 'all' || !b.cancelled)
              .map((b) => (
                <article key={b.id}>
                  <div className="inline-person">
                    <Avatar name={w.contacts.find((c) => c.id === b.contactId)?.name || ''} />
                    <span>
                      <strong>{w.contacts.find((c) => c.id === b.contactId)?.name}</strong>
                      <small>
                        {b.service} · {b.staff}
                      </small>
                    </span>
                    <Badge tone={b.cancelled ? 'neutral' : 'blue'}>
                      {t(b.cancelled ? 'Cancelled' : 'Booked')}
                    </Badge>
                  </div>
                  <p>{businessDate(b.slot, data.language, true)}</p>
                  {!b.cancelled && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        run(() =>
                          repo.updateWorkspace((s) => {
                            s.bookings.find((row) => row.id === b.id)!.cancelled = true;
                          }),
                        )
                      }
                    >
                      {t('Cancel booking')}
                    </Button>
                  )}
                </article>
              ))}
            {!w.bookings.filter((b) => filter === 'all' || !b.cancelled).length && <Empty />}
          </div>
        </section>
      </div>
    </>
  );
}

export function PostsPage() {
  const { w, repo, run, t } = useStore();
  const [id, setId] = useState(w.posts[0]?.id || '');
  const post = w.posts.find((p) => p.id === id);
  return (
    <>
      <PageHeader
        title={t('Post automation')}
        subtitle={t('No real comments are sent.')}
        actions={
          <Button
            onClick={() => {
              const id = uid();
              if (
                run(() =>
                  repo.updateWorkspace((s) =>
                    s.posts.push({
                      id,
                      title: t('New post'),
                      keyword: '',
                      reply: '',
                      enabled: false,
                    }),
                  ),
                )
              )
                setId(id);
            }}
          >
            <Plus size={16} />
            {t('Post')}
          </Button>
        }
      />
      <div className="toolbar">
        <Field label={t('Post')}>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {w.posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Badge>{t('Demo')}</Badge>
      </div>
      {post ? <PostEditor key={post.id} post={post} /> : <Empty />}
    </>
  );
}
function PostEditor({ post }: { post: Workspace['posts'][number] }) {
  const { t, repo, run, notify } = useStore();
  const [draft, setDraft] = useState(post);
  const [test, setTest] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(post);
  useUnsaved(dirty);
  return (
    <div className="two-columns">
      <section className="panel settings-panel">
        <div className="section-title">
          <h2>
            <Megaphone size={19} />
            {t('Post')}
          </h2>
          <Badge tone={dirty ? 'amber' : 'green'}>{t(dirty ? 'Unsaved changes' : 'Saved')}</Badge>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.title.trim() || !draft.keyword.trim() || !draft.reply.trim())
              return notify('required', true);
            run(() =>
              repo.updateWorkspace((s) => {
                s.posts[s.posts.findIndex((p) => p.id === post.id)] = draft;
              }),
            );
          }}
        >
          <Field label={t('Title')}>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label={t('Keyword')}>
            <input
              required
              value={draft.keyword}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            />
          </Field>
          <Field label={t('Reply')}>
            <textarea
              required
              rows={5}
              value={draft.reply}
              onChange={(e) => setDraft({ ...draft, reply: e.target.value })}
            />
          </Field>
          <Toggle
            checked={draft.enabled}
            label={t('Enabled')}
            onChange={(enabled) => setDraft({ ...draft, enabled })}
          />
          <Button type="submit">
            <Save size={15} />
            {t('Save')}
          </Button>
        </form>
      </section>
      <section className="panel settings-panel">
        <h2>{t('Reply preview')}</h2>
        <MessageBubble
          compact
          message={{ id: 'post-preview', role: 'bot', text: draft.reply, at: '' }}
        />
        <h3 className="section-spacer">{t('Local test')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setResult(
              post.enabled &&
                normalize(post.keyword) &&
                normalize(test).includes(normalize(post.keyword))
                ? post.reply
                : '',
            );
          }}
        >
          <Field label={t('Test comment')}>
            <input required value={test} onChange={(e) => setTest(e.target.value)} />
          </Field>
          <Button type="submit" variant="secondary">
            {t('Simulate')}
          </Button>
        </form>
        {result !== null && (
          <div className="post-test-result">
            <Badge tone={result ? 'green' : 'amber'}>
              {t(result ? 'Rule matched' : 'No matching rule')}
            </Badge>
            {result && <p>{result}</p>}
          </div>
        )}
        <p className="small muted">{t('No real comments are sent.')}</p>
      </section>
    </div>
  );
}

export function MessagingPage() {
  const { w, t, repo, run, notify } = useStore();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('all');
  const [message, setMessage] = useState('');
  const [id, setId] = useState('');
  const [search, setSearch] = useState('');
  const audience = w.contacts.filter((c) => tag === 'all' || c.tags.includes(tag));
  return (
    <>
      <PageHeader
        title={t('Messaging')}
        subtitle={t(
          'Real sending is unavailable. Consent and server-side policy checks are required.',
        )}
      />
      <div className="two-columns">
        <section className="panel settings-panel">
          <h2>
            <Send size={18} />
            {t('Save as draft')}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !message.trim()) return notify('required', true);
              const campaign = {
                id: id || uid(),
                name: name.trim(),
                tag,
                message: message.trim(),
                updatedAt: new Date().toISOString(),
              };
              if (
                run(() =>
                  repo.updateWorkspace((s) => {
                    const i = s.campaigns.findIndex((c) => c.id === campaign.id);
                    if (i >= 0) s.campaigns[i] = campaign;
                    else s.campaigns.push(campaign);
                  }),
                )
              )
                setId(campaign.id);
            }}
          >
            <Field label={t('Campaign name')}>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('Audience')}>
              <select value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="all">{t('All')}</option>
                {[...new Set(w.contacts.flatMap((c) => c.tags))].map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
            </Field>
            <Badge tone="blue">
              {audience.length} {t('Contacts')}
            </Badge>
            <Field label={t('Message')}>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            <Button type="submit">
              <Save size={15} />
              {t('Save as draft')}
            </Button>
          </form>
        </section>
        <section className="panel settings-panel">
          <h2>{t('Message preview')}</h2>
          <MessageBubble
            compact
            message={{ id: 'campaign-preview', role: 'staff', text: message || '…', at: '' }}
          />
          <p className="inline-info">
            {t('Real sending is unavailable. Consent and server-side policy checks are required.')}
          </p>
        </section>
      </div>
      <section className="panel settings-panel section-spacer">
        <div className="section-title">
          <h2>{t('Draft campaigns')}</h2>
          <SearchInput value={search} onChange={setSearch} />
        </div>
        {w.campaigns
          .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
          .map((c) => (
            <div className="campaign-row" key={c.id}>
              <span className="stat-icon blue">
                <Send size={17} />
              </span>
              <button
                className="table-link"
                onClick={() => {
                  setId(c.id);
                  setName(c.name);
                  setTag(c.tag);
                  setMessage(c.message);
                }}
              >
                {c.name}
              </button>
              <Badge>{t('Draft')}</Badge>
              <IconButton
                label={t('Delete')}
                onClick={() => {
                  if (
                    run(() =>
                      repo.updateWorkspace((s) => {
                        s.campaigns = s.campaigns.filter((row) => row.id !== c.id);
                      }),
                    )
                  ) {
                    if (id === c.id) {
                      setId('');
                      setName('');
                      setMessage('');
                    }
                  }
                }}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
        {!w.campaigns.length && <Empty />}
      </section>
    </>
  );
}

export function AnalyticsPage() {
  const { w, t, data } = useStore();
  const [from, setFrom] = useState(ulaanbaatarDay(new Date(Date.now() - 6 * 86400_000)));
  const [to, setTo] = useState(ulaanbaatarDay());
  const within = (iso: string) => {
    const date = ulaanbaatarDay(new Date(iso));
    return (!from || date >= from) && (!to || date <= to);
  };
  const conversations = w.conversations.filter((c) => c.messages.some((m) => within(m.at)));
  const orders = w.orders.filter((o) => within(o.createdAt) && o.fulfillment !== 'cancelled');
  return (
    <>
      <PageHeader
        title={t('Analytics')}
        subtitle={t(
          'Order value is not verified revenue. Demo payments are excluded from real revenue claims.',
        )}
      />
      <div className="toolbar date-toolbar">
        <Field label={t('From')}>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label={t('To')}>
          <input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Badge>{t('Ulaanbaatar time (UTC+8)')}</Badge>
      </div>
      {from && to && from > to ? (
        <div className="inline-error">{t('Please complete all required fields.')}</div>
      ) : (
        <>
          <div className="stats-grid analytics-stats">
            {[
              { title: 'Conversations', value: conversations.length, Icon: MessagesSquare },
              { title: 'Orders', value: orders.length, Icon: ClipboardList },
              {
                title: 'Order value',
                value: money(orders.reduce((s, o) => s + total(o), 0)),
                Icon: Sparkles,
              },
            ].map(({ title, value, Icon }) => (
              <div className="stat-card" key={title}>
                <div>
                  <span className="stat-icon blue">
                    <Icon size={18} />
                  </span>
                  <span>{t(title)}</span>
                </div>
                <strong>{value}</strong>
                <small>{t('Local demo')}</small>
              </div>
            ))}
          </div>
          <div className="two-columns">
            <section className="panel">
              <div className="panel-heading">
                <h2>{t('Conversation volume')}</h2>
                <Badge>{t('Last 7 days')}</Badge>
              </div>
              {conversations.length ? (
                <ActivityChart
                  conversations={conversations.map((c) => ({
                    ...c,
                    messages: c.messages.filter((m) => within(m.at)),
                  }))}
                />
              ) : (
                <Empty title={t('No records in this period')} />
              )}
            </section>
            <section className="panel settings-panel">
              <h2>{t('Channel breakdown')}</h2>
              {['messenger', 'instagram', 'web'].map((channel) => {
                const count = conversations.filter((c) => c.channel === channel).length;
                return (
                  <div className="channel-breakdown" key={channel}>
                    <div>
                      <strong>
                        {channel === 'messenger'
                          ? 'Messenger'
                          : channel === 'instagram'
                            ? 'Instagram'
                            : 'Web chat'}
                      </strong>
                      <span>{count}</span>
                    </div>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${conversations.length ? (count / conversations.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
          <section className="panel table-panel section-spacer">
            <div className="panel-heading">
              <h2>{t('Orders')}</h2>
              <Badge>{orders.length}</Badge>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {['Order', 'Customer', 'Total', 'Date'].map((h) => (
                      <th key={h}>{t(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link className="table-link" to={`/app/orders?order=${o.id}`}>
                          {o.id}
                        </Link>
                      </td>
                      <td>{w.contacts.find((c) => c.id === o.contactId)?.name}</td>
                      <td>{money(total(o))}</td>
                      <td>{businessDate(o.createdAt, data.language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!orders.length && <Empty title={t('No records in this period')} />}
          </section>
        </>
      )}
    </>
  );
}
export function BillingPage() {
  const { w, t } = useStore();
  const [upgrade, setUpgrade] = useState(false);
  const usage = [
    { label: 'Bots', amount: w.bots.filter((b) => !b.archived).length, Icon: Bot },
    { label: 'Conversations', amount: w.conversations.length, Icon: MessagesSquare },
    {
      label: 'Published knowledge',
      amount: w.knowledge.filter((k) => k.published).length,
      Icon: BookOpen,
    },
  ];
  return (
    <>
      <PageHeader
        title={t('Plan & usage')}
        subtitle={t(
          'No subscription or payment is activated. Final pricing and checkout are not configured.',
        )}
      />
      <section className="panel current-plan">
        <div>
          <Badge tone="blue">{t('Current demo plan')}</Badge>
          <h2>{t('Demo workspace')}</h2>
          <p>
            {t(
              'Pro features are included in paid plan examples. Add-ons are optional modules. Every module is explorable in this demo; no purchase is made.',
            )}
          </p>
        </div>
        <Button onClick={() => setUpgrade(true)}>
          <Sparkles size={17} />
          {t('Explore plans')}
        </Button>
      </section>
      <div className="usage-grid">
        {usage.map(({ label, amount, Icon }) => (
          <section className="panel usage-card" key={label}>
            <Icon size={20} />
            <div>
              <span>{t(label)}</span>
              <strong>{amount}</strong>
            </div>
          </section>
        ))}
      </div>
      <div className="section-title">
        <h2>{t('Plan preview')}</h2>
      </div>
      <PricingCards />
      {upgrade && (
        <Modal title={t('Plan preview')} onClose={() => setUpgrade(false)}>
          <p>
            {t(
              'No subscription or payment is activated. Final pricing and checkout are not configured.',
            )}
          </p>
          <Badge tone="blue">{t('Demo workspace')}</Badge>
          <div className="form-actions">
            <Button onClick={() => setUpgrade(false)}>{t('Close')}</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
