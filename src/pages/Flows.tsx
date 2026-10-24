import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Save,
  Play,
  Check,
  Copy,
  Trash2,
  ArrowDown,
  GitBranch,
  MessageSquare,
  CircleHelp,
  Sparkles,
  Headset,
  Flag,
  Send,
  RotateCcw,
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
} from '../components/ui';
import type { Bot, FlowNode } from '../domain/models';
import { nodeTypes } from '../domain/models';
import { uid, validateFlow, businessDate } from '../domain/services';
import { runFlow } from '../domain/flow';
import type { FlowPreviewState } from '../domain/flow';
import { errorKeys } from '../i18n';

export const nodeLabels: Record<FlowNode['type'], string> = {
  start: 'Start',
  message: 'Message',
  question: 'Question',
  condition: 'Condition',
  ai: 'AI fallback',
  handoff: 'Human handoff',
};
const nodeIcons = {
  start: Flag,
  message: MessageSquare,
  question: CircleHelp,
  condition: GitBranch,
  ai: Sparkles,
  handoff: Headset,
};
import { useUnsaved } from '../hooks';
export function FlowsPage() {
  const { w, t } = useStore();
  const bot = w.bots.find((b) => b.id === w.selectedBotId && !b.archived);
  if (!bot)
    return (
      <>
        <PageHeader title={t('Message blocks')} />
        <Empty title={t('Create a bot to get started.')}>
          <Link className="button button-primary" to="/app/bots">
            {t('Create bot')}
          </Link>
        </Empty>
      </>
    );
  return <FlowEditor key={bot.id} bot={bot} />;
}
function FlowEditor({ bot }: { bot: Bot }) {
  const { w, repo, t, run, notify, data } = useStore();
  const [nodes, setNodes] = useState(() => structuredClone(bot.flow.draft));
  const [selected, setSelected] = useState(nodes[0]?.id || '');
  const [add, setAdd] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<FlowPreviewState | null>(null);
  const [input, setInput] = useState('');
  const dirty = JSON.stringify(nodes) !== JSON.stringify(bot.flow.draft);
  useUnsaved(dirty);
  const node = nodes.find((n) => n.id === selected);
  const change = <K extends keyof FlowNode>(key: K, value: FlowNode[K]) => {
    setNodes((prev) => prev.map((n) => (n.id === selected ? { ...n, [key]: value } : n)));
    setErrors([]);
  };
  const save = () =>
    run(() =>
      repo.updateWorkspace((s) => {
        const b = s.bots.find((b) => b.id === bot.id)!;
        b.flow.draft = structuredClone(nodes);
        b.updatedAt = new Date().toISOString();
      }),
    );
  const validate = () => {
    const result = validateFlow(nodes);
    setErrors(result);
    if (!result.length) notify('Flow is valid');
    return result.length === 0;
  };
  return (
    <>
      <PageHeader
        title={t('Flow editor')}
        subtitle={bot.name}
        actions={
          <>
            <Badge tone={dirty ? 'amber' : 'green'}>
              {t(dirty ? 'Unsaved changes' : 'Saved draft')}
            </Badge>
            <Button variant="secondary" onClick={save}>
              <Save size={15} />
              {t('Save draft')}
            </Button>
            <Button
              onClick={() => {
                if (dirty) return notify('Save your draft before publishing.', true);
                if (validate())
                  run(
                    () =>
                      repo.updateWorkspace((s) => {
                        const b = s.bots.find((b) => b.id === bot.id)!;
                        b.flow.published = structuredClone(nodes);
                        b.flow.publishedAt = new Date().toISOString();
                      }),
                    'Flow published',
                  );
              }}
            >
              <Check size={16} />
              {t('Publish')}
            </Button>
          </>
        }
      />
      <div className="flow-toolbar">
        <div className="row-actions">
          <Badge tone={bot.flow.published ? 'green' : 'neutral'}>
            {t(bot.flow.published ? 'Published' : 'Draft')}
          </Badge>
          {bot.flow.publishedAt && (
            <small>{businessDate(bot.flow.publishedAt, data.language, true)}</small>
          )}
        </div>
        <div className="row-actions">
          <Button variant="secondary" onClick={() => setAdd(true)}>
            <Plus size={15} />
            {t('Add block')}
          </Button>
          <Button variant="ghost" onClick={validate}>
            <Check size={15} />
            {t('Validate')}
          </Button>
          <Button
            variant="secondary"
            disabled={!bot.flow.published}
            onClick={() => setPreview(runFlow(w, bot.flow.published!, data.language))}
          >
            <Play size={15} />
            {t('Run published preview')}
          </Button>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="inline-error" role="alert">
          <ul>
            {errors.map((e) => (
              <li key={e}>{t(errorKeys[e])}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flow-layout">
        <section className="panel flow-block-list">
          <div className="panel-heading">
            <h2>{t('Message blocks')}</h2>
            <Badge>{nodes.length}</Badge>
          </div>
          {nodes.map((n) => {
            const Icon = nodeIcons[n.type];
            return (
              <button
                className={selected === n.id ? 'selected' : ''}
                key={n.id}
                onClick={() => setSelected(n.id)}
              >
                <Icon size={16} />
                <span>{n.title}</span>
              </button>
            );
          })}
        </section>
        <section className="flow-canvas" aria-label={t('Flow editor')}>
          <div className="flow-canvas-caption">
            <span className="status-dot" />
            {t('Draft changes')}
          </div>
          <div className="flow-node-stack">
            {nodes.map((n) => {
              const Icon = nodeIcons[n.type];
              return (
                <div className="flow-node-wrap" key={n.id}>
                  <button
                    className={`flow-node node-${n.type} ${selected === n.id ? 'selected' : ''}`}
                    onClick={() => setSelected(n.id)}
                  >
                    <div>
                      <span>
                        <Icon size={16} />
                      </span>
                      <small>{t(nodeLabels[n.type])}</small>
                      <span className="node-connector" />
                    </div>
                    <strong>{n.title}</strong>
                    {n.text && <p>{n.text}</p>}
                    <footer>
                      → {nodes.find((next) => next.id === n.next)?.title || t('End flow')}
                      {n.type === 'condition' && (
                        <small>
                          {t('Otherwise')}:{' '}
                          {nodes.find((next) => next.id === n.alternate)?.title || '—'}
                        </small>
                      )}
                    </footer>
                  </button>
                  {n.next && (
                    <div className="flow-arrow">
                      <ArrowDown size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel flow-properties">
          <div className="panel-heading">
            <h2>{t('Properties')}</h2>
          </div>
          {node ? (
            <>
              <Badge tone="blue">{t(nodeLabels[node.type])}</Badge>
              <Field label={t('Title')}>
                <input value={node.title} onChange={(e) => change('title', e.target.value)} />
              </Field>
              {['message', 'question'].includes(node.type) && (
                <Field label={t('Message')}>
                  <textarea
                    rows={5}
                    value={node.text}
                    onChange={(e) => change('text', e.target.value)}
                  />
                </Field>
              )}
              {node.type === 'condition' && (
                <Field label={t('Contains')}>
                  <input
                    value={node.condition}
                    onChange={(e) => change('condition', e.target.value)}
                  />
                </Field>
              )}
              <Field label={t('Next block')}>
                <select value={node.next} onChange={(e) => change('next', e.target.value)}>
                  <option value="">{t('End flow')}</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </Field>
              {node.type === 'condition' && (
                <Field label={t('Otherwise')}>
                  <select
                    value={node.alternate}
                    onChange={(e) => change('alternate', e.target.value)}
                  >
                    <option value="">—</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="flow-property-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const copy = { ...node, id: uid(), title: `${node.title} (2)` };
                    setNodes([...nodes, copy]);
                    setSelected(copy.id);
                  }}
                >
                  <Copy size={14} />
                  {t('Duplicate')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const remaining = nodes
                      .filter((n) => n.id !== node.id)
                      .map((n) => ({
                        ...n,
                        next: n.next === node.id ? '' : n.next,
                        alternate: n.alternate === node.id ? '' : n.alternate,
                      }));
                    setNodes(remaining);
                    setSelected(remaining[0]?.id || '');
                  }}
                >
                  <Trash2 size={14} />
                  {t('Delete')}
                </Button>
              </div>
            </>
          ) : (
            <Empty />
          )}
        </section>
      </div>
      {add && (
        <Modal title={t('Add block')} onClose={() => setAdd(false)}>
          <div className="node-type-picker">
            {nodeTypes.map((type) => {
              const Icon = nodeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    const n: FlowNode = {
                      id: uid(),
                      type,
                      title: t(nodeLabels[type]),
                      text: '',
                      next: '',
                      alternate: '',
                      condition: '',
                    };
                    setNodes([...nodes, n]);
                    setSelected(n.id);
                    setAdd(false);
                  }}
                >
                  <Icon size={20} />
                  <strong>{t(nodeLabels[type])}</strong>
                  <Plus size={15} />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title={`${t('Preview')} · ${t('Published')}`} onClose={() => setPreview(null)}>
          <div className="flow-phone">
            <div className="phone-notch" />
            <div className="phone-title">
              <Sparkles size={17} />
              <strong>{bot.name}</strong>
              <Badge>{t('Demo')}</Badge>
            </div>
            <div className="phone-messages" role="log">
              {preview.messages.map((m) => (
                <MessageBubble key={m.id} message={m} products={w.products} compact />
              ))}
              {preview.ended && <Badge tone="green">{t('Flow finished')}</Badge>}
            </div>
            {preview.waiting && (
              <form
                className="test-chat-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPreview(runFlow(w, bot.flow.published!, data.language, preview, input));
                  setInput('');
                }}
              >
                <input
                  required
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label={t('Reply to continue')}
                  placeholder={t('Reply to continue')}
                />
                <IconButton type="submit" label={t('Send locally')}>
                  <Send size={17} />
                </IconButton>
              </form>
            )}
            <Button
              variant="ghost"
              onClick={() => setPreview(runFlow(w, bot.flow.published!, data.language))}
            >
              <RotateCcw size={14} />
              {t('Restart')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
