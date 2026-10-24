import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  BookOpen,
  Sparkles,
  Send,
  Check,
  FileText,
  Search,
} from 'lucide-react';
import { useStore } from '../store';
import {
  Badge,
  Button,
  Empty,
  Field,
  IconButton,
  MessageBubble,
  Modal,
  PageHeader,
  SearchInput,
  Tabs,
  Toggle,
} from '../components/ui';
import { simulate, uid } from '../domain/services';
import type { KnowledgeEntry, Message } from '../domain/models';

export function KnowledgePage() {
  const { w, repo, t, run, data, notify } = useStore();
  const [tab, setTab] = useState('faq');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<KnowledgeEntry | null>(null);
  const [deleting, setDeleting] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [handoff, setHandoff] = useState(false);
  const [behavior, setBehavior] = useState(w.replyBehavior);
  const entries = w.knowledge.filter(
    (k) =>
      k.kind === tab &&
      `${k.title} ${k.content} ${k.keywords}`.toLowerCase().includes(search.toLowerCase()),
  );
  const ask = (text: string) => {
    if (!text.trim()) return;
    const result = simulate(w, text, data.language);
    const at = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'customer', text, at },
      {
        id: uid(),
        role: 'bot',
        text: result.text,
        at,
        ...(result.productId ? { productId: result.productId } : {}),
      },
    ]);
    setHandoff(result.handoff);
    setQuestion('');
  };
  const add = () =>
    setEdit({
      id: uid(),
      kind: tab as KnowledgeEntry['kind'],
      title: '',
      content: '',
      keywords: '',
      enabled: true,
      published: false,
    });
  return (
    <>
      <PageHeader
        title={t('Knowledge & AI')}
        subtitle={t('Knows your business.')}
        actions={
          <Badge tone="blue">
            <BookOpen size={12} />
            {w.knowledge.filter((k) => k.published && k.enabled).length} {t('Published')}
          </Badge>
        }
      />
      <div className="knowledge-layout">
        <section className="knowledge-main">
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              ['business', 'Business information'],
              ['faq', 'FAQs'],
              ['document', 'Source documents'],
              ['behavior', 'Reply behavior'],
            ].map(([value, label]) => ({ value, label: t(label) }))}
          />
          {tab !== 'behavior' ? (
            <>
              <div className="toolbar">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={t('Search knowledge')}
                />
                <Button onClick={add}>
                  <Plus size={15} />
                  {t('Add entry')}
                </Button>
              </div>
              {tab === 'document' && (
                <div className="import-document">
                  <FileText size={20} />
                  <div>
                    <strong>{t('Import text / Markdown')}</strong>
                    <p>
                      {t('Text and Markdown are read locally. PDF extraction is not connected.')}
                    </p>
                  </div>
                  <label className="button button-secondary">
                    <Upload size={15} />
                    {t('Import text / Markdown')}
                    <input
                      className="sr-only"
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!/\.(txt|md)$/i.test(file.name) || file.size > 1_000_000)
                          return notify('required', true);
                        const content = await file.text();
                        setEdit({
                          id: uid(),
                          kind: 'document',
                          title: file.name,
                          content,
                          keywords: '',
                          enabled: true,
                          published: false,
                        });
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              )}
              <div className="knowledge-entries">
                {entries.map((k) => (
                  <article className="panel knowledge-entry" key={k.id}>
                    <div className="knowledge-entry-title">
                      <span className={`entry-icon ${k.kind === 'document' ? 'purple' : 'blue'}`}>
                        <BookOpen size={17} />
                      </span>
                      <div>
                        <h3>{k.title}</h3>
                        <span className="tags">
                          <Badge tone={k.published ? 'green' : 'amber'}>
                            {t(k.published ? 'Published' : 'Draft')}
                          </Badge>
                          {!k.enabled && <Badge>{t('Archived')}</Badge>}
                        </span>
                      </div>
                      <IconButton label={t('Edit')} onClick={() => setEdit(structuredClone(k))}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label={t('Delete')} onClick={() => setDeleting(k.id)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                    <p>{k.content}</p>
                    {k.keywords && (
                      <small className="keyword-line">
                        <Search size={12} />
                        {k.keywords}
                      </small>
                    )}
                    <div className="knowledge-entry-actions">
                      <label className="checkbox-inline">
                        <input
                          type="checkbox"
                          checked={k.enabled}
                          onChange={(e) =>
                            run(
                              () =>
                                repo.updateWorkspace((s) => {
                                  s.knowledge.find((entry) => entry.id === k.id)!.enabled =
                                    e.target.checked;
                                }),
                              '',
                            )
                          }
                        />
                        {t('Enabled')}
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          run(() =>
                            repo.updateWorkspace((s) => {
                              s.knowledge.find((entry) => entry.id === k.id)!.published =
                                !k.published;
                            }),
                          )
                        }
                      >
                        {k.published ? (
                          t('Unpublish')
                        ) : (
                          <>
                            <Check size={13} />
                            {t('Publish')}
                          </>
                        )}
                      </Button>
                    </div>
                  </article>
                ))}
                {!entries.length && (
                  <Empty>
                    <Button onClick={add}>
                      <Plus size={15} />
                      {t('Add entry')}
                    </Button>
                  </Empty>
                )}
              </div>
            </>
          ) : (
            <section className="panel behavior-panel">
              <h2>{t('Reply behavior')}</h2>
              <p className="muted">
                {t(
                  'The demo matches your published FAQs and products locally. Unknown questions are clarified or handed to a person.',
                )}
              </p>
              <Field label={t('Notes')}>
                <textarea rows={5} value={behavior} onChange={(e) => setBehavior(e.target.value)} />
              </Field>
              <Toggle
                label={t('Human help suggested')}
                checked
                onChange={() =>
                  notify(
                    'The demo matches your published FAQs and products locally. Unknown questions are clarified or handed to a person.',
                  )
                }
              />
              <Button
                onClick={() =>
                  run(() =>
                    repo.updateWorkspace((s) => {
                      s.replyBehavior = behavior;
                    }),
                  )
                }
              >
                {t('Save')}
              </Button>
            </section>
          )}
        </section>
        <aside className="test-chat-panel panel">
          <div className="test-chat-heading">
            <div className="stat-icon blue">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>{t('Test your assistant')}</h2>
              <small>{t('Demo response')}</small>
            </div>
            <IconButton
              label={t('Reset demo')}
              onClick={() => {
                setMessages([]);
                setHandoff(false);
              }}
            >
              <Trash2 size={15} />
            </IconButton>
          </div>
          <p className="test-chat-note">
            {t('Replies use published knowledge and current products.')}
          </p>
          <div className="test-chat-messages" role="log" aria-label={t('Demo response')}>
            {!messages.length && (
              <div className="test-chat-empty">
                <Sparkles size={28} />
                <h3>{t('Questions answered with care.')}</h3>
                <small>{t('Suggested questions')}</small>
                <div>
                  {[
                    'Хүргэлт хэд вэ?',
                    'hurgelt',
                    w.products[0]?.name || 'Product',
                    data.language === 'mn' ? 'Сар руу хүргэх үү?' : 'Do you deliver to the Moon?',
                  ].map((q) => (
                    <button key={q} onClick={() => ask(q)}>
                      {q}
                      <ArrowSmall />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} products={w.products} />
            ))}
            {handoff && <Badge tone="amber">{t('Human help suggested')}</Badge>}
          </div>
          <form
            className="test-chat-compose"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <input
              aria-label={t('Ask a question…')}
              placeholder={t('Ask a question…')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
            <IconButton label={t('Ask')} type="submit">
              <Send size={18} />
            </IconButton>
          </form>
        </aside>
      </div>
      {edit && <EntryEditor entry={edit} onClose={() => setEdit(null)} />}
      {deleting && (
        <Modal title={t('Remove this record?')} onClose={() => setDeleting('')}>
          <p>{t('This action removes this local record.')}</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDeleting('')}>
              {t('Cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  run(() =>
                    repo.updateWorkspace((s) => {
                      s.knowledge = s.knowledge.filter((k) => k.id !== deleting);
                    }),
                  )
                )
                  setDeleting('');
              }}
            >
              {t('Delete')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ArrowSmall() {
  return <span aria-hidden="true">↗</span>;
}
function EntryEditor({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) {
  const { repo, t, run } = useStore();
  const [draft, setDraft] = useState(entry);
  return (
    <Modal title={t('Add entry')} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim() || !draft.content.trim()) return;
          if (
            run(() =>
              repo.updateWorkspace((s) => {
                const index = s.knowledge.findIndex((k) => k.id === draft.id);
                const value = {
                  ...draft,
                  title: draft.title.trim(),
                  content: draft.content.trim(),
                  published: false,
                };
                if (index >= 0) s.knowledge[index] = value;
                else s.knowledge.push(value);
              }),
            )
          )
            onClose();
        }}
      >
        <Field label={t('Title')}>
          <input
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <Field label={t('Answer / content')}>
          <textarea
            rows={6}
            required
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          />
        </Field>
        <Field
          label={t('Keywords')}
          help={t(
            'Separate matching phrases with commas. Cyrillic and Latin keywords are supported.',
          )}
        >
          <input
            value={draft.keywords}
            onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
          />
        </Field>
        <p className="inline-info">
          {t('Save draft')} → {t('Publish')}
        </p>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="submit">{t('Save draft')}</Button>
        </div>
      </form>
    </Modal>
  );
}
