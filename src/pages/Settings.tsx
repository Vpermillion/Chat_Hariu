import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Save,
  Trash2,
  Radio,
  MessageCircle,
  Instagram,
  Globe2,
  ExternalLink,
  Check,
  Bell,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Field,
  IconButton,
  PageHeader,
  Tabs,
  Toggle,
  Modal,
} from '../components/ui';
import type { Bot, Business } from '../domain/models';
import { uid } from '../domain/services';
import { useUnsaved } from '../hooks';
import { staff } from '../config';

export function ChannelsPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useStore();
  const [details, setDetails] = useState(false);
  return (
    <>
      {!embedded && (
        <PageHeader
          title={t('Channels')}
          subtitle={t('Your team and your assistant, working together.')}
        />
      )}
      <div className="channel-info">
        <Radio size={22} />
        <div>
          <strong>{t('Demo channel')}</strong>
          <p>
            {t(
              'Real channel connections require server OAuth, webhook verification and Meta permissions. This demo cannot connect a Facebook Page.',
            )}
          </p>
        </div>
      </div>
      <div className="channel-cards">
        {[
          { name: 'Messenger', Icon: MessageCircle, tone: 'blue' },
          { name: 'Instagram', Icon: Instagram, tone: 'purple' },
          { name: 'Web chat', Icon: Globe2, tone: 'green' },
        ].map(({ name, Icon, tone }) => (
          <article className="panel channel-card" key={name}>
            <span className={`stat-icon ${tone}`}>
              <Icon size={25} />
            </span>
            <h2>{name}</h2>
            <Badge tone="neutral">{t('Not connected')}</Badge>
            <p className="muted">{t('Planned integration')}</p>
            <Button variant="secondary" onClick={() => setDetails(true)}>
              {t('Integration details')}
              <ExternalLink size={14} />
            </Button>
            <Link className="text-link" to="/app/inbox">
              {t('Explore demo inbox')} →
            </Link>
          </article>
        ))}
      </div>
      {details && (
        <Modal title={t('Setup required')} onClose={() => setDetails(false)}>
          <p>
            {t(
              'Real channel connections require server OAuth, webhook verification and Meta permissions. This demo cannot connect a Facebook Page.',
            )}
          </p>
          <Link className="button button-primary" to="/app/inbox" onClick={() => setDetails(false)}>
            {t('Explore demo inbox')}
          </Link>
        </Modal>
      )}
    </>
  );
}
export function SettingsPage() {
  const { w, t } = useStore();
  const [tab, setTab] = useState('general');
  const bot = w.bots.find((b) => b.id === w.selectedBotId && !b.archived);
  return (
    <>
      <PageHeader title={t('Settings')} subtitle={bot?.name || t('Business details')} />
      <Tabs
        value={tab}
        onChange={setTab}
        options={['General', 'Main menu', 'Page connection', 'Team'].map((label, i) => ({
          label: t(label),
          value: ['general', 'menu', 'channels', 'team'][i],
        }))}
      />
      {tab === 'channels' ? (
        <ChannelsPage embedded />
      ) : tab === 'team' ? (
        <TeamSettings />
      ) : bot ? (
        <BotSettings key={bot.id} bot={bot} tab={tab} />
      ) : (
        <Empty title={t('Create a bot to get started.')}>
          <Link className="button button-primary" to="/app/bots">
            {t('Create bot')}
          </Link>
        </Empty>
      )}
    </>
  );
}
function BotSettings({ bot, tab }: { bot: Bot; tab: string }) {
  const { repo, run, t, notify } = useStore();
  const [settings, setSettings] = useState(() => structuredClone(bot.settings));
  const [name, setName] = useState(bot.name);
  const dirty = name !== bot.name || JSON.stringify(settings) !== JSON.stringify(bot.settings);
  useUnsaved(dirty);
  const update = <K extends keyof Bot['settings']>(key: K, value: Bot['settings'][K]) =>
    setSettings((s) => ({ ...s, [key]: value }));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !settings.greeting.trim() ||
      settings.questions.some((q) => !q.question.trim() || !q.answer.trim())
    )
      return notify('required', true);
    for (const item of settings.menu) {
      if (!item.label.trim() || !item.target.trim()) return notify('required', true);
      if (item.type === 'url') {
        try {
          const url = new URL(item.target);
          if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
        } catch {
          return notify('required', true);
        }
      } else if (!bot.flow.draft.some((n) => n.id === item.target))
        return notify('flowConnectionError', true);
    }
    if (settings.fallbackId && !bot.flow.draft.some((n) => n.id === settings.fallbackId))
      return notify('flowConnectionError', true);
    run(() =>
      repo.updateWorkspace((s) => {
        const b = s.bots.find((b) => b.id === bot.id)!;
        b.name = name.trim();
        b.settings = settings;
        b.updatedAt = new Date().toISOString();
      }),
    );
  };
  return (
    <form onSubmit={save}>
      <div className="settings-save-bar">
        <Badge tone={dirty ? 'amber' : 'green'}>{t(dirty ? 'Unsaved changes' : 'Saved')}</Badge>
        <Button type="submit" disabled={!dirty}>
          <Save size={15} />
          {t('Save')}
        </Button>
      </div>
      {tab === 'general' ? (
        <div className="settings-grid">
          <div>
            <section className="panel settings-panel">
              <div className="section-title">
                <h2>{t('General')}</h2>
                <Badge>{t('Demo')}</Badge>
              </div>
              <Field label={t('Bot name')}>
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Toggle
                checked={settings.active}
                label={t('Bot active')}
                onChange={(v) => update('active', v)}
              />
              <Toggle
                checked={settings.automated}
                label={t('Automated conversations')}
                onChange={(v) => update('automated', v)}
              />
              <Toggle
                checked={settings.typing}
                label={t('Typing indicator')}
                onChange={(v) => update('typing', v)}
              />
              <Field label={t('Fallback block')}>
                <select
                  value={
                    bot.flow.draft.some((n) => n.id === settings.fallbackId)
                      ? settings.fallbackId
                      : ''
                  }
                  onChange={(e) => update('fallbackId', e.target.value)}
                >
                  <option value="">—</option>
                  {bot.flow.draft.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Sender persona')}>
                <input
                  value={settings.persona}
                  onChange={(e) => update('persona', e.target.value)}
                />
              </Field>
            </section>
            <section className="panel settings-panel">
              <h2>{t('Initial questions')}</h2>
              {settings.questions.map((q, i) => (
                <div className="initial-question" key={i}>
                  <Field label={`${t('Question')} ${i + 1}`}>
                    <input
                      required
                      value={q.question}
                      onChange={(e) =>
                        update(
                          'questions',
                          settings.questions.map((row, index) =>
                            index === i ? { ...row, question: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label={t('Answer')}>
                    <input
                      required
                      value={q.answer}
                      onChange={(e) =>
                        update(
                          'questions',
                          settings.questions.map((row, index) =>
                            index === i ? { ...row, answer: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <IconButton
                    label={t('Delete')}
                    type="button"
                    onClick={() =>
                      update(
                        'questions',
                        settings.questions.filter((_, index) => i !== index),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  update('questions', [...settings.questions, { question: '', answer: '' }])
                }
              >
                <Plus size={15} />
                {t('Add question')}
              </Button>
            </section>
          </div>
          <aside>
            <section className="panel settings-panel">
              <h2>{t('Welcome message')}</h2>
              <Field label={t('Message')}>
                <textarea
                  required
                  rows={6}
                  value={settings.greeting}
                  onChange={(e) => update('greeting', e.target.value)}
                />
              </Field>
              <div className="greeting-preview">
                <span className="stat-icon blue">
                  <MessageCircle size={19} />
                </span>
                <strong>{settings.persona || name}</strong>
                <p>{settings.greeting}</p>
                <div className="quick-replies">
                  {settings.questions
                    .filter((q) => q.question)
                    .map((q, i) => (
                      <span key={i}>{q.question}</span>
                    ))}
                </div>
                <Badge>{t('Preview')}</Badge>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <section className="panel settings-panel menu-settings">
          <h2>{t('Main menu')}</h2>
          {settings.menu.map((item, i) => (
            <div className="menu-item-editor" key={item.id}>
              <Field label={t('Label')}>
                <input
                  required
                  value={item.label}
                  onChange={(e) =>
                    update(
                      'menu',
                      settings.menu.map((row, index) =>
                        i === index ? { ...row, label: e.target.value } : row,
                      ),
                    )
                  }
                />
              </Field>
              <Field label={t('Target')}>
                <select
                  value={item.type}
                  onChange={(e) =>
                    update(
                      'menu',
                      settings.menu.map((row, index) =>
                        i === index
                          ? { ...row, type: e.target.value as 'url' | 'block', target: '' }
                          : row,
                      ),
                    )
                  }
                >
                  <option value="url">URL</option>
                  <option value="block">{t('Block')}</option>
                </select>
              </Field>
              <Field label={item.type === 'url' ? 'URL' : t('Block')}>
                {item.type === 'url' ? (
                  <input
                    required
                    type="url"
                    placeholder="https://example.com"
                    value={item.target}
                    onChange={(e) =>
                      update(
                        'menu',
                        settings.menu.map((row, index) =>
                          i === index ? { ...row, target: e.target.value } : row,
                        ),
                      )
                    }
                  />
                ) : (
                  <select
                    required
                    value={item.target}
                    onChange={(e) =>
                      update(
                        'menu',
                        settings.menu.map((row, index) =>
                          i === index ? { ...row, target: e.target.value } : row,
                        ),
                      )
                    }
                  >
                    <option value="">—</option>
                    {bot.flow.draft.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <IconButton
                type="button"
                label={t('Delete')}
                onClick={() =>
                  update(
                    'menu',
                    settings.menu.filter((row) => row.id !== item.id),
                  )
                }
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              update('menu', [...settings.menu, { id: uid(), label: '', type: 'url', target: '' }])
            }
          >
            <Plus size={15} />
            {t('Add menu item')}
          </Button>
        </section>
      )}
    </form>
  );
}
function TeamSettings() {
  const { data, w, t, repo, run } = useStore();
  const business = data.businesses.find((b) => b.id === data.activeBusinessId)!;
  const [draft, setDraft] = useState<Business>(business);
  return (
    <div className="settings-grid">
      <section className="panel settings-panel">
        <h2>{t('Business details')}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              repo.transact((d) => {
                d.businesses[d.businesses.findIndex((b) => b.id === draft.id)] = draft;
              }),
            );
          }}
        >
          <Field label={t('Business name')}>
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label={t('Address')}>
            <input
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label={t('Phone')}>
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
            <Field label={t('Email')}>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
          </div>
          <Button type="submit">
            <Check size={15} />
            {t('Save')}
          </Button>
        </form>
        <h3 className="section-spacer">
          <Bell size={15} />
          {t('Notification preferences')}
        </h3>
        <Toggle
          label={t('Enable local notifications')}
          checked={w.notifications}
          onChange={(enabled) =>
            run(() =>
              repo.updateWorkspace((s) => {
                s.notifications = enabled;
              }),
            )
          }
        />
      </section>
      <section className="panel settings-panel">
        <h2>{t('Team')}</h2>
        <p className="muted">{t('Demo roles are examples, not production access control.')}</p>
        {staff.map((name, i) => (
          <div className="team-member" key={name}>
            <Avatar name={name} />
            <strong>{name}</strong>
            <Badge tone={i === 0 ? 'blue' : 'neutral'}>{t(['Owner', 'Agent', 'Viewer'][i])}</Badge>
          </div>
        ))}
      </section>
    </div>
  );
}
