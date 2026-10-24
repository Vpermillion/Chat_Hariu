import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Headset,
  Info,
  MessageSquare,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
  StickyNote,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Avatar,
  Badge,
  Button,
  ChannelIcon,
  channelName,
  Empty,
  Field,
  IconButton,
  MessageBubble,
  Modal,
  PageHeader,
  SearchInput,
  Tabs,
} from '../components/ui';
import { businessDate, money, reply, simulatedCustomerMessage, total } from '../domain/services';
import { CreateOrderModal, fulfillmentLabel } from './Commerce';
import { staff } from '../config';
import type { Contact, Conversation } from '../domain/models';

export function InboxPage({ live = false }: { live?: boolean }) {
  const { w, data, repo, run, t } = useStore();
  const [params, setParams] = useSearchParams();
  const [defaultId, setDefaultId] = useState(() =>
    window.matchMedia('(max-width: 600px)').matches
      ? ''
      : (live
          ? w.conversations.find((c) => c.human && c.status === 'open')?.id
          : w.conversations[0]?.id) || '',
  );
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState(live ? 'human' : 'all');
  const [details, setDetails] = useState(false);
  const [mode, setMode] = useState<'staff' | 'note'>('staff');
  const [order, setOrder] = useState(false);
  const [products, setProducts] = useState(false);
  const [productId, setProductId] = useState<string>();
  const [test, setTest] = useState(false);
  const [testText, setTestText] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const conversations = w.conversations.filter(
    (c) =>
      (channel === 'all' || c.channel === channel) &&
      (status === 'all' ||
        (status === 'human' && c.human && c.status === 'open') ||
        (status === 'unread' && c.unread > 0) ||
        c.status === status) &&
      `${w.contacts.find((p) => p.id === c.contactId)?.name} ${c.messages.map((m) => m.text).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = w.conversations.find((c) => c.id === (params.get('conversation') || defaultId));
  const contact = w.contacts.find((c) => c.id === selected?.contactId);
  const unread = selected?.unread;
  const selectedId = selected?.id;
  useEffect(() => {
    if (unread && selectedId)
      run(
        () =>
          repo.updateWorkspace((s) => {
            s.conversations.find((c) => c.id === selectedId)!.unread = 0;
          }),
        '',
      ); /* run only when selected unread changes */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread, selectedId, repo]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [selected?.messages.length, selectedId]);
  const mutate = (update: (c: Conversation) => void, message = 'Saved') =>
    run(
      () =>
        repo.updateWorkspace((s) => {
          const c = s.conversations.find((c) => c.id === selected?.id);
          if (c) update(c);
        }),
      message,
    );
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      selected &&
      run(
        () => repo.updateWorkspace((s) => reply(s, selected.id, selected.draft, mode, productId)),
        '',
      )
    ) {
      setProductId(undefined);
    }
  };
  return (
    <>
      <PageHeader
        title={t(live ? 'Live agent' : 'Conversations')}
        subtitle={t('A place for every conversation.')}
        actions={
          <Badge tone="blue">
            {w.conversations.filter((c) => c.status === 'open').length} {t('Open')}
          </Badge>
        }
      />
      <div
        className={`inbox-workspace ${params.has('conversation') ? 'mobile-thread-selected' : ''} ${details ? 'details-open' : ''}`}
      >
        <section className="conversation-list">
          <div className="conversation-list-tools">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search conversations')}
            />
            <div className="inbox-filters">
              <select
                aria-label={t('Channel')}
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value);
                  setDefaultId('');
                  setParams({});
                }}
              >
                <option value="all">{t('All channels')}</option>
                <option value="messenger">Messenger</option>
                <option value="instagram">Instagram</option>
                <option value="web">Web chat</option>
              </select>
              <select
                aria-label={t('Status')}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setDefaultId('');
                  setParams({});
                }}
              >
                {[
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['resolved', 'Resolved'],
                  ['human', 'Human'],
                  ['unread', 'Unanswered'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="conversation-scroll">
            {conversations.map((c) => {
              const p = w.contacts.find((p) => p.id === c.contactId)!;
              const last = c.messages.filter((m) => m.role !== 'note').at(-1);
              return (
                <button
                  className={`conversation-row ${selected?.id === c.id ? 'selected' : ''} ${c.unread ? 'unread' : ''}`}
                  key={c.id}
                  onClick={() => {
                    setParams({ conversation: c.id });
                    setProductId(undefined);
                    setMode('staff');
                  }}
                >
                  <div className="avatar-channel">
                    <Avatar name={p.name} />
                    <ChannelIcon channel={c.channel} />
                  </div>
                  <div className="conversation-row-content">
                    <div>
                      <strong>{p.name}</strong>
                      <time>{last && businessDate(last.at, data.language)}</time>
                    </div>
                    <p>{last?.text}</p>
                    <div className="conversation-row-tags">
                      <span className="source-chip">{c.source}</span>
                      <span
                        className={`conversation-status ${c.status === 'resolved' ? 'green' : c.human ? 'amber' : 'blue'}`}
                      >
                        {c.status === 'resolved' ? (
                          <CheckCheck size={11} />
                        ) : c.human ? (
                          <Headset size={11} />
                        ) : (
                          <Sparkles size={11} />
                        )}
                        {t(c.status === 'resolved' ? 'Resolved' : c.human ? 'Human' : 'Assistant')}
                      </span>
                      {c.unread > 0 && <i className="unread-count">{c.unread}</i>}
                    </div>
                  </div>
                </button>
              );
            })}
            {!conversations.length && <Empty />}
          </div>
        </section>
        {selected && contact ? (
          <>
            <section className="thread-pane">
              <div className="thread-heading">
                <IconButton
                  label={t('Back to conversations')}
                  className="mobile-only"
                  onClick={() => setParams({})}
                >
                  <ArrowLeft size={20} />
                </IconButton>
                <Avatar name={contact.name} size="small" />
                <div className="thread-title">
                  <strong>{contact.name}</strong>
                  <small>
                    {channelName(selected.channel)} · {selected.source} <span>· {t('Demo')}</span>
                  </small>
                </div>
                <IconButton
                  label={t(selected.status === 'resolved' ? 'Reopen' : 'Resolve')}
                  onClick={() =>
                    mutate((c) => {
                      c.status = c.status === 'resolved' ? 'open' : 'resolved';
                    })
                  }
                >
                  <CheckCheck size={19} />
                </IconButton>
                <IconButton
                  label={t('Customer details')}
                  aria-expanded={details}
                  onClick={() => setDetails(!details)}
                >
                  <Info size={19} />
                </IconButton>
              </div>
              <div className={`thread-automation ${selected.human ? 'paused' : ''}`}>
                <span>
                  {selected.human ? <Headset size={14} /> : <Sparkles size={14} />}
                  {t(selected.human ? 'Assistant paused' : 'Assistant')}
                  <Badge>{t('Demo')}</Badge>
                </span>
                <button
                  onClick={() =>
                    mutate((c) => {
                      c.human = !c.human;
                    })
                  }
                >
                  {t(selected.human ? 'Resume assistant' : 'Take over')}
                  <ChevronDown size={12} />
                </button>
              </div>
              <div className="thread-messages">
                <div className="thread-date">{t('Demo data · Browser only')}</div>
                {selected.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} products={w.products} />
                ))}
                <div ref={bottom} />
              </div>
              <div className="thread-bottom">
                <div className="composer-tabs">
                  <button
                    className={mode === 'staff' ? 'active' : ''}
                    onClick={() => setMode('staff')}
                  >
                    <MessageSquare size={14} />
                    {t('Reply')}
                  </button>
                  <button
                    className={mode === 'note' ? 'active note' : ''}
                    onClick={() => setMode('note')}
                  >
                    <StickyNote size={14} />
                    {t('Note')}
                  </button>
                  <button
                    className="test-trigger"
                    aria-expanded={test}
                    onClick={() => setTest(!test)}
                  >
                    <Sparkles size={13} />
                    {t('Local test')}
                  </button>
                </div>
                <form
                  className={`reply-composer ${mode === 'note' ? 'note-composer' : ''}`}
                  onSubmit={send}
                >
                  <label className="sr-only" htmlFor="reply-text">
                    {t(mode === 'note' ? 'Write a private note…' : 'Write a reply…')}
                  </label>
                  <textarea
                    id="reply-text"
                    rows={2}
                    value={selected.draft}
                    onChange={(e) =>
                      mutate((c) => {
                        c.draft = e.target.value;
                      }, '')
                    }
                    placeholder={t(mode === 'note' ? 'Write a private note…' : 'Write a reply…')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  {productId && (
                    <div className="attached-product">
                      <ShoppingBag size={14} />
                      {w.products.find((p) => p.id === productId)?.name}
                      <IconButton
                        type="button"
                        label={t('Close')}
                        onClick={() => setProductId(undefined)}
                      >
                        <X size={13} />
                      </IconButton>
                    </div>
                  )}
                  <div className="composer-actions">
                    <div>
                      <label className="saved-reply">
                        <span className="sr-only">{t('Saved reply')}</span>
                        <select
                          aria-label={t('Saved reply')}
                          value=""
                          onChange={(e) =>
                            mutate((c) => {
                              c.draft = e.target.value;
                            }, '')
                          }
                        >
                          <option value="">{t('Saved reply')}</option>
                          {w.knowledge
                            .filter((k) => k.enabled && k.published)
                            .map((k) => (
                              <option key={k.id} value={k.content}>
                                {k.title}
                              </option>
                            ))}
                        </select>
                      </label>
                      <IconButton
                        type="button"
                        label={t('Insert product')}
                        onClick={() => setProducts(true)}
                      >
                        <ShoppingBag size={17} />
                      </IconButton>
                    </div>
                    <Button type="submit" disabled={!selected.draft.trim() && !productId}>
                      <Send size={14} />
                      {t('Send locally')}
                    </Button>
                  </div>
                </form>
                {test && (
                  <form
                    className="customer-simulator"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        run(
                          () =>
                            repo.updateWorkspace((s) => {
                              const c = s.conversations.find((c) => c.id === selected.id)!;
                              simulatedCustomerMessage(s, c, testText, data.language);
                            }),
                          '',
                        )
                      )
                        setTestText('');
                    }}
                  >
                    <Field label={t('Simulate customer message')}>
                      <input
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        required
                        placeholder={t('Test message')}
                      />
                    </Field>
                    <Button variant="secondary" type="submit">
                      {t('Simulate')}
                    </Button>
                  </form>
                )}
                <p className="delivery-disclaimer">
                  {t(
                    'All messages here are local demo records. Nothing is delivered to a social network.',
                  )}
                </p>
              </div>
            </section>
            <aside className="customer-pane">
              <div className="customer-pane-heading">
                <strong>{t('Customer details')}</strong>
                <IconButton label={t('Close')} onClick={() => setDetails(false)}>
                  <X size={17} />
                </IconButton>
              </div>
              <div className="customer-profile">
                <Avatar name={contact.name} size="large" />
                <h3>{contact.name}</h3>
                <Badge>{t('Customer')}</Badge>
              </div>
              <Field label={t('Assigned to')}>
                <select
                  value={selected.assignee}
                  onChange={(e) =>
                    mutate((c) => {
                      c.assignee = e.target.value;
                    })
                  }
                >
                  <option value="">{t('Unassigned')}</option>
                  {staff.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <div className="detail-line">
                <small>{t('Phone')}</small>
                <span>{contact.phone}</span>
              </div>
              <div className="detail-line">
                <small>{t('Address')}</small>
                <span>{contact.address}</span>
              </div>
              <div className="detail-line">
                <small>{t('Tags')}</small>
                <div className="tags">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} tone="purple">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Field label={t('Notes')}>
                <textarea
                  rows={2}
                  value={contact.note}
                  onChange={(e) =>
                    run(
                      () =>
                        repo.updateWorkspace((s) => {
                          s.contacts.find((c) => c.id === contact.id)!.note = e.target.value;
                        }),
                      '',
                    )
                  }
                />
              </Field>
              <div className="customer-orders">
                <div className="section-title">
                  <h3>{t('Related orders')}</h3>
                  <Badge>{w.orders.filter((o) => o.contactId === contact.id).length}</Badge>
                </div>
                {w.orders
                  .filter((o) => o.contactId === contact.id)
                  .map((o) => (
                    <Link to={`/app/orders?order=${o.id}`} key={o.id}>
                      <ShoppingBag size={17} />
                      <span>
                        <strong>{o.id}</strong>
                        <small>{t(fulfillmentLabel[o.fulfillment])}</small>
                      </span>
                      <strong>{money(total(o))}</strong>
                    </Link>
                  ))}
                <Button variant="secondary" onClick={() => setOrder(true)}>
                  <Plus size={15} />
                  {t('Create order draft')}
                </Button>
              </div>
            </aside>
          </>
        ) : (
          <div className="thread-pane">
            <Empty title={t('Choose a conversation')} />
          </div>
        )}
      </div>
      {selected && order && (
        <CreateOrderModal
          contactId={selected.contactId}
          conversationId={selected.id}
          onClose={() => setOrder(false)}
        />
      )}
      {products && (
        <Modal title={t('Insert product')} onClose={() => setProducts(false)}>
          <div className="select-product-list">
            {w.products
              .filter((p) => !p.archived)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProductId(p.id);
                    setProducts(false);
                  }}
                >
                  <ShoppingBag size={17} />
                  <span>{p.name}</span>
                  <strong>{money(p.price)}</strong>
                  <Plus size={15} />
                </button>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}

export function ContactsPage() {
  const { w, t } = useStore();
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('all');
  const [selected, setSelected] = useState<Contact | null>(null);
  const contacts = w.contacts.filter(
    (c) =>
      `${c.name} ${c.phone} ${c.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()) &&
      (tag === 'all' || c.tags.includes(tag)),
  );
  return (
    <>
      <PageHeader
        title={t('Contacts')}
        subtitle={t('The full conversation, with the context to help.')}
        actions={
          <Badge tone="blue">
            {w.contacts.length} {t('Contacts')}
          </Badge>
        }
      />
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('Search contacts')} />
        <select aria-label={t('Tags')} value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="all">
            {t('All')} · {t('Tags')}
          </option>
          {[...new Set(w.contacts.flatMap((c) => c.tags))].map((tag) => (
            <option key={tag}>{tag}</option>
          ))}
        </select>
      </div>
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {['Customer', 'Phone', 'Tags', 'Conversations', 'Orders', 'Actions'].map((h) => (
                  <th key={h}>{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button className="inline-person table-link" onClick={() => setSelected(c)}>
                      <Avatar name={c.name} />
                      {c.name}
                    </button>
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    <div className="tags">
                      {c.tags.map((tag) => (
                        <Badge key={tag} tone="purple">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>{w.conversations.filter((v) => v.contactId === c.id).length}</td>
                  <td>
                    {
                      w.orders.filter((o) => o.contactId === c.id && o.fulfillment !== 'cancelled')
                        .length
                    }
                  </td>
                  <td>
                    <Button variant="ghost" onClick={() => setSelected(c)}>
                      {t('Contact history')}
                      <UserRound size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!contacts.length && <Empty />}
      </section>
      {selected && <ContactDetail contact={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { w, repo, t, run } = useStore();
  const [draft, setDraft] = useState(contact);
  const [tags, setTags] = useState(contact.tags.join(', '));
  const [tab, setTab] = useState('details');
  return (
    <Modal title={contact.name} onClose={onClose} wide>
      <Tabs
        value={tab}
        onChange={setTab}
        options={['Customer details', 'Conversations', 'Orders'].map((label, i) => ({
          label: t(label),
          value: ['details', 'conversations', 'orders'][i],
        }))}
      />
      {tab === 'details' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              run(() =>
                repo.updateWorkspace((s) => {
                  const index = s.contacts.findIndex((c) => c.id === contact.id);
                  s.contacts[index] = {
                    ...draft,
                    tags: [
                      ...new Set(
                        tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      ),
                    ],
                  };
                }),
              )
            )
              onClose();
          }}
        >
          <div className="form-grid">
            <Field label={t('Name')}>
              <input
                value={draft.name}
                required
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label={t('Phone')}>
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t('Address')}>
            <input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </Field>
          <Field label={t('Tags')} help={t('Comma-separated tags')}>
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <Field label={t('Notes')}>
            <textarea
              rows={3}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </Field>
          <div className="form-actions">
            <Button type="submit">
              <Check size={15} />
              {t('Save')}
            </Button>
          </div>
        </form>
      )}
      {tab === 'conversations' && (
        <div className="history-list">
          {w.conversations
            .filter((c) => c.contactId === contact.id)
            .map((c) => (
              <Link key={c.id} to={`/app/inbox?conversation=${c.id}`}>
                <MessageSquare size={18} />
                <span>
                  {channelName(c.channel)} · {c.messages.at(-1)?.text}
                </span>
                <Badge>{t(c.status === 'open' ? 'Open' : 'Resolved')}</Badge>
              </Link>
            ))}
        </div>
      )}
      {tab === 'orders' && (
        <div className="history-list">
          {w.orders
            .filter((o) => o.contactId === contact.id)
            .map((o) => (
              <Link key={o.id} to={`/app/orders?order=${o.id}`}>
                <ShoppingBag size={18} />
                <span>{o.id}</span>
                <Badge>{t(fulfillmentLabel[o.fulfillment])}</Badge>
                <strong>{money(total(o))}</strong>
              </Link>
            ))}
        </div>
      )}
    </Modal>
  );
}
