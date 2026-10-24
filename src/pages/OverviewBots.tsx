import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Plus,
  Bot as BotIcon,
  MessagesSquare,
  Clock3,
  Headset,
  ShoppingBag,
  ArrowRight,
  Copy,
  Archive,
  RotateCcw,
  Pencil,
  Sparkles,
  Check,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Badge,
  Button,
  PageHeader,
  PanelLink,
  CheckItem,
  Avatar,
  ChannelIcon,
  SearchInput,
  Empty,
  Modal,
  Field,
  IconButton,
} from '../components/ui';
import { overview, total, money, businessDate, uid } from '../domain/services';
import { newBot } from '../domain/seed';
import type { Bot, Conversation } from '../domain/models';

export function ActivityChart({ conversations }: { conversations: Conversation[] }) {
  const { data, t } = useStore();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const date = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ulaanbaatar' });
    return {
      date,
      d,
      count: conversations.filter((c) =>
        c.messages.some(
          (m) =>
            new Date(m.at).toLocaleDateString('en-CA', { timeZone: 'Asia/Ulaanbaatar' }) === date,
        ),
      ).length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div
      className="activity-chart"
      role="img"
      aria-label={`${t('Conversation activity')}: ${days.map((d) => `${businessDate(d.d.toISOString(), data.language)} ${d.count}`).join('; ')}`}
    >
      <div className="chart-grid">
        <span>{max}</span>
        <span>{Math.ceil(max / 2)}</span>
        <span>0</span>
      </div>
      <div className="chart-bars">
        {days.map((day) => (
          <div className="chart-column" key={day.date}>
            <span className="chart-value">{day.count}</span>
            <div
              className={`chart-bar ${day.count === max && max > 0 ? 'highlight' : ''}`}
              style={{ height: `${day.count ? Math.max(6, (day.count / max) * 135) : 2}px` }}
            />
            <small>
              {new Intl.DateTimeFormat(data.language === 'mn' ? 'mn-MN' : 'en-GB', {
                day: 'numeric',
                month: 'numeric',
                timeZone: 'Asia/Ulaanbaatar',
              }).format(day.d)}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
export function OverviewPage() {
  const { w, data, t } = useStore();
  const metrics = overview(w);
  const business = data.businesses.find((b) => b.id === data.activeBusinessId)!;
  const steps = [
    {
      label: 'Add your knowledge',
      path: '/app/knowledge',
      done: w.knowledge.some((k) => k.published),
    },
    { label: 'Choose a channel', path: '/app/channels', done: w.bots.some((b) => !b.archived) },
    {
      label: 'Test a conversation',
      path: '/app/inbox',
      done: w.conversations.some((c) => c.messages.some((m) => m.role === 'staff')),
    },
    {
      label: 'Publish your flow',
      path: '/app/flows',
      done: w.bots.some((b) => !!b.flow.published),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow={`${t('Welcome back')}, Номин ☀`}
        title={t('Your day, at a glance.')}
        subtitle={t('Here is what is happening with your business.')}
        actions={
          <>
            <Badge>
              <span className="status-dot" />
              {t('Local demo')}
            </Badge>
            <Link className="button button-primary" to="/app/inbox">
              <MessagesSquare size={16} />
              {t('Open inbox')}
            </Link>
          </>
        }
      />
      <div className="stats-grid">
        {[
          {
            label: 'Conversations',
            value: metrics.conversations,
            icon: MessagesSquare,
            tone: 'blue',
          },
          { label: 'Unanswered', value: metrics.unanswered, icon: Clock3, tone: 'amber' },
          { label: 'Human handoffs', value: metrics.handoffs, icon: Headset, tone: 'purple' },
          { label: 'Orders', value: metrics.orders, icon: ShoppingBag, tone: 'green' },
        ].map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div>
              <span className={`stat-icon ${stat.tone}`}>
                <stat.icon size={19} />
              </span>
              <span className="stat-label">{t(stat.label)}</span>
            </div>
            <strong data-testid={`metric-${stat.label.toLowerCase().replaceAll(' ', '-')}`}>
              {stat.value}
            </strong>
            <small>
              {business.name}
              <ArrowUpRight size={14} />
            </small>
          </article>
        ))}
      </div>
      <div className="overview-middle">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('Conversation activity')}</h2>
              <small>{t('Last 7 days')}</small>
            </div>
            <Badge tone="blue">
              {metrics.conversations} {t('Conversations')}
            </Badge>
          </div>
          <ActivityChart conversations={w.conversations} />
        </section>
        <section className="panel onboarding-panel">
          <div className="panel-heading">
            <span className="stat-icon blue">
              <Sparkles size={20} />
            </span>
            <Badge>{steps.filter((s) => s.done).length} / 4</Badge>
          </div>
          <h2>{t('Finish setting up')}</h2>
          <p className="muted">{t('Your next steps')}</p>
          <div className="onboarding-progress">
            <span style={{ width: `${steps.filter((s) => s.done).length * 25}%` }} />
          </div>
          <div className="onboarding-steps">
            {steps.map((s) => (
              <Link to={s.path} key={s.path}>
                <CheckItem done={s.done}>{t(s.label)}</CheckItem>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      <div className="overview-bottom">
        <section className="panel">
          <div className="panel-heading">
            <h2>{t('Recent conversations')}</h2>
            <PanelLink to="/app/inbox">{t('View all')}</PanelLink>
          </div>
          <div className="recent-conversations">
            {w.conversations.slice(0, 4).map((c) => {
              const contact = w.contacts.find((p) => p.id === c.contactId)!;
              return (
                <Link to={`/app/inbox?conversation=${c.id}`} key={c.id}>
                  <div className="avatar-channel">
                    <Avatar name={contact.name} />
                    <ChannelIcon channel={c.channel} />
                  </div>
                  <div>
                    <strong>{contact.name}</strong>
                    <p>{c.messages.at(-1)?.text}</p>
                  </div>
                  <div className="recent-status">
                    <Badge tone={c.status === 'resolved' ? 'green' : c.human ? 'amber' : 'blue'}>
                      {t(c.status === 'resolved' ? 'Resolved' : c.human ? 'Human' : 'Assistant')}
                    </Badge>
                    <small>{businessDate(c.messages.at(-1)!.at, data.language)}</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>{t('Recent orders')}</h2>
            <PanelLink to="/app/orders">{t('View all')}</PanelLink>
          </div>
          {w.orders.length ? (
            <div className="recent-orders">
              {w.orders.slice(0, 4).map((o) => (
                <Link to={`/app/orders?order=${o.id}`} key={o.id}>
                  <span className="order-icon">
                    <ShoppingBag size={17} />
                  </span>
                  <div>
                    <strong>{w.contacts.find((c) => c.id === o.contactId)?.name}</strong>
                    <small>{o.id}</small>
                  </div>
                  <span>
                    <strong>{money(total(o))}</strong>
                    <Badge tone={o.payment === 'unverified' ? 'amber' : 'green'}>
                      {t(o.payment === 'unverified' ? 'Unverified' : 'Simulated paid')}
                    </Badge>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty title={t('No orders yet')} />
          )}
        </section>
      </div>
      <div className="dashboard-tip">
        <Sparkles size={17} />
        <span>{t('A little help. A lot more possibility.')}</span>
        <Link to="/app/knowledge">
          {t('Test your assistant')} <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}

export function BotsPage() {
  const { w, repo, t, data, run } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [editing, setEditing] = useState<Bot | 'new' | null>(null);
  const [name, setName] = useState('');
  const visible = w.bots.filter(
    (b) =>
      (filter === 'all' || b.archived === (filter === 'archived')) &&
      b.name.toLowerCase().includes(search.toLowerCase()),
  );
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (
      run(() =>
        repo.updateWorkspace((s) => {
          if (editing === 'new') {
            const bot = newBot(name.trim(), uid());
            s.bots.push(bot);
            s.selectedBotId = bot.id;
          } else {
            const bot = s.bots.find((b) => b.id === editing?.id)!;
            bot.name = name.trim();
            bot.updatedAt = new Date().toISOString();
          }
        }),
      )
    ) {
      setEditing(null);
      setName('');
    }
  };
  const archive = (bot: Bot) =>
    run(() =>
      repo.updateWorkspace((s) => {
        const b = s.bots.find((b) => b.id === bot.id)!;
        b.archived = !b.archived;
        b.updatedAt = new Date().toISOString();
        if (s.selectedBotId === b.id && b.archived)
          s.selectedBotId = s.bots.find((b) => !b.archived)?.id || '';
      }),
    );
  return (
    <>
      <PageHeader
        title={t('Bots')}
        subtitle={t('Your team and your assistant, working together.')}
        actions={
          <Button
            onClick={() => {
              setEditing('new');
              setName('');
            }}
          >
            <Plus size={17} />
            {t('Create bot')}
          </Button>
        }
      />
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('Search bots')} />
        <select aria-label={t('Status')} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {['active', 'archived', 'all'].map((f) => (
            <option key={f} value={f}>
              {t(f === 'active' ? 'Active' : f === 'archived' ? 'Archived' : 'All')}
            </option>
          ))}
        </select>
        <span className="toolbar-count">
          {visible.length} {t('Bots')}
        </span>
      </div>
      <div className="bot-grid">
        <button
          className="create-bot-card"
          onClick={() => {
            setEditing('new');
            setName('');
          }}
        >
          <span>
            <Plus size={24} />
          </span>
          <strong>{t('Create bot')}</strong>
          <small>{t('A place for every conversation.')}</small>
        </button>
        {visible.map((bot) => (
          <article className={`bot-card ${bot.archived ? 'archived' : ''}`} key={bot.id}>
            <div className="bot-card-top">
              <span className="bot-avatar">
                <BotIcon size={27} />
              </span>
              <Badge tone={bot.archived ? 'neutral' : bot.flow.published ? 'green' : 'amber'}>
                {t(bot.archived ? 'Archived' : bot.flow.published ? 'Published' : 'Draft')}
              </Badge>
            </div>
            <h2>{bot.name}</h2>
            <span className="bot-channel">
              <ChannelIcon channel={bot.channel} />
              {bot.channel === 'messenger'
                ? 'Messenger'
                : bot.channel === 'instagram'
                  ? 'Instagram'
                  : 'Web chat'}
              <Badge>{t('Demo')}</Badge>
            </span>
            <small className="bot-updated">
              {t('Updated')} · {businessDate(bot.updatedAt, data.language, true)}
            </small>
            <div className="bot-card-actions">
              {!bot.archived && (
                <Link
                  className="button button-secondary"
                  to="/app/settings"
                  onClick={() =>
                    run(
                      () =>
                        repo.updateWorkspace((s) => {
                          s.selectedBotId = bot.id;
                        }),
                      '',
                    )
                  }
                >
                  {t('Configure')}
                  <ArrowRight size={14} />
                </Link>
              )}
              <IconButton
                label={t('Rename')}
                onClick={() => {
                  setEditing(bot);
                  setName(bot.name);
                }}
              >
                <Pencil size={16} />
              </IconButton>
              <IconButton
                label={t('Duplicate')}
                onClick={() =>
                  run(() =>
                    repo.updateWorkspace((s) => {
                      const copy = structuredClone(bot);
                      copy.id = uid();
                      copy.name += ' (2)';
                      copy.archived = false;
                      copy.flow.published = null;
                      copy.flow.publishedAt = null;
                      copy.updatedAt = new Date().toISOString();
                      s.bots.push(copy);
                    }),
                  )
                }
              >
                <Copy size={16} />
              </IconButton>
              <IconButton
                label={t(bot.archived ? 'Restore' : 'Archive')}
                onClick={() => archive(bot)}
              >
                {bot.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
              </IconButton>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <Empty />}
      {editing && (
        <Modal
          title={t(editing === 'new' ? 'Create bot' : 'Rename')}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label={t('Bot name')}>
              <input
                required
                maxLength={70}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => setEditing(null)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                <Check size={16} />
                {t(editing === 'new' ? 'Create' : 'Save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
