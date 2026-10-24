import { useState } from 'react';
import { Plus, Save, Check, Trash2, FileText, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { Badge, Button, Empty, Field, IconButton, Modal, PageHeader, Tabs } from '../components/ui';
import type { Workspace } from '../domain/models';
import { businessDate, uid } from '../domain/services';
import { useUnsaved } from '../hooks';

export function PagesPage() {
  const { w, t, repo, run } = useStore();
  const [selected, setSelected] = useState(w.pages[0]?.id || '');
  const page = w.pages.find((p) => p.id === selected);
  return (
    <>
      <PageHeader
        title={t('Static pages')}
        subtitle={t('Content editor')}
        actions={
          <Button
            onClick={() => {
              const id = uid();
              if (
                run(() =>
                  repo.updateWorkspace((s) =>
                    s.pages.push({
                      id,
                      title: t('New page'),
                      slug: `page-${id.slice(0, 6)}`,
                      content: '',
                      published: null,
                    }),
                  ),
                )
              )
                setSelected(id);
            }}
          >
            <Plus size={16} />
            {t('New page')}
          </Button>
        }
      />
      <div className="content-layout">
        <aside className="panel content-list">
          {w.pages.map((p) => (
            <button
              key={p.id}
              className={p.id === selected ? 'selected' : ''}
              onClick={() => setSelected(p.id)}
            >
              <FileText size={17} />
              <span>
                {p.title}
                <small>/{p.slug}</small>
              </span>
              <Badge tone={p.published ? 'green' : 'amber'}>
                {t(p.published ? 'Published' : 'Draft')}
              </Badge>
            </button>
          ))}
        </aside>
        {page ? <PageEditor key={page.id} page={page} /> : <Empty />}
      </div>
    </>
  );
}
function PageEditor({ page }: { page: Workspace['pages'][number] }) {
  const { w, repo, t, run, notify } = useStore();
  const [draft, setDraft] = useState({ title: page.title, slug: page.slug, content: page.content });
  const [preview, setPreview] = useState(false);
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify({ title: page.title, slug: page.slug, content: page.content });
  useUnsaved(dirty);
  const save = () => {
    if (
      !draft.title.trim() ||
      !draft.content.trim() ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) ||
      w.pages.some(
        (p) => p.id !== page.id && (p.slug === draft.slug || p.published?.slug === draft.slug),
      )
    )
      return notify('required', true);
    run(() =>
      repo.updateWorkspace((s) => {
        Object.assign(
          s.pages.find((p) => p.id === page.id)!,
          draft,
        );
      }),
    );
  };
  return (
    <section className="panel content-editor">
      <div className="section-title">
        <h2>{t('Content editor')}</h2>
        <Badge tone={dirty ? 'amber' : 'green'}>
          {t(dirty ? 'Unsaved changes' : 'Saved draft')}
        </Badge>
      </div>
      <Field label={t('Page title')}>
        <input
          required
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </Field>
      <Field label={t('Slug')} help="a-z, 0-9, -">
        <input
          required
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
        />
      </Field>
      <Field label={t('Content')}>
        <textarea
          rows={12}
          required
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        />
      </Field>
      <div className="form-actions">
        <Button variant="secondary" onClick={save}>
          <Save size={15} />
          {t('Save draft')}
        </Button>
        <Button
          onClick={() => {
            if (dirty || !page.content.trim())
              return notify('Save your draft before publishing.', true);
            run(() =>
              repo.updateWorkspace((s) => {
                const p = s.pages.find((p) => p.id === page.id)!;
                p.published = { title: p.title, slug: p.slug, content: p.content };
              }),
            );
          }}
        >
          <Check size={15} />
          {t('Publish')}
        </Button>
        {page.published && (
          <Button variant="ghost" onClick={() => setPreview(true)}>
            <ExternalLink size={15} />
            {t('Published preview')}
          </Button>
        )}
      </div>
      {page.published && (
        <p className="muted small">
          {t('Published')}: /{page.published.slug}
        </p>
      )}
      {preview && page.published && (
        <Modal title={t('Published preview')} onClose={() => setPreview(false)}>
          <Badge>{t('Local demo')}</Badge>
          <h1>{page.published.title}</h1>
          <div className="prose-preview">{page.published.content}</div>
          <small>/{page.published.slug}</small>
        </Modal>
      )}
    </section>
  );
}

export function FormsPage({ survey = false }: { survey?: boolean }) {
  const { w, repo, t, run } = useStore();
  const collection = survey ? w.surveys : w.forms;
  const [selectedId, setSelectedId] = useState(collection[0]?.id || '');
  const [tab, setTab] = useState('builder');
  const selected = collection.find((f) => f.id === selectedId);
  const create = () => {
    const id = uid();
    if (
      run(() =>
        repo.updateWorkspace((s) => {
          if (survey)
            s.surveys.push({
              id,
              title: t('New survey'),
              questions: [{ id: uid(), label: t('Question'), type: 'text', options: [] }],
              responses: [],
            });
          else
            s.forms.push({
              id,
              title: t('New form'),
              fields: [{ id: uid(), label: t('Name'), type: 'text', required: true }],
              responses: [],
            });
        }),
      )
    ) {
      setSelectedId(id);
      setTab('builder');
    }
  };
  return (
    <>
      <PageHeader
        title={t(survey ? 'Surveys' : 'Web forms')}
        subtitle={t('Demo data · Browser only')}
        actions={
          <Button onClick={create}>
            <Plus size={16} />
            {t(survey ? 'New survey' : 'New form')}
          </Button>
        }
      />
      <div className="toolbar">
        <Field label={t('Title')}>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {collection.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </Field>
        <Badge tone="blue">
          {selected?.responses.length || 0} {t('Responses')}
        </Badge>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        options={['Form builder', 'Preview', 'Responses'].map((label, i) => ({
          value: ['builder', 'preview', 'responses'][i],
          label: t(label === 'Form builder' && survey ? 'Surveys' : label),
          ...(i === 2 ? { count: selected?.responses.length } : {}),
        }))}
      />
      {selected ? (
        tab === 'responses' ? (
          <ResponsesTable record={selected} survey={survey} />
        ) : survey ? (
          <SurveyEditor
            key={selectedId}
            record={selected as Workspace['surveys'][number]}
            preview={tab === 'preview'}
          />
        ) : (
          <FormEditor
            key={selectedId}
            record={selected as Workspace['forms'][number]}
            preview={tab === 'preview'}
          />
        )
      ) : (
        <Empty />
      )}
    </>
  );
}
function FormEditor({ record, preview }: { record: Workspace['forms'][number]; preview: boolean }) {
  const { repo, t, run, notify } = useStore();
  const [title, setTitle] = useState(record.title);
  const [fields, setFields] = useState(() => structuredClone(record.fields));
  const [values, setValues] = useState<Record<string, string>>({});
  const dirty = title !== record.title || JSON.stringify(fields) !== JSON.stringify(record.fields);
  useUnsaved(dirty);
  if (preview)
    return (
      <section className="panel submission-preview">
        <Badge>{t('Local demo')}</Badge>
        <h2>{record.title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (record.fields.some((f) => f.required && !values[f.id]?.trim()))
              return notify('required', true);
            if (
              run(
                () =>
                  repo.updateWorkspace((s) => {
                    s.forms
                      .find((f) => f.id === record.id)!
                      .responses.push({ id: uid(), at: new Date().toISOString(), values });
                  }),
                'Response saved',
              )
            )
              setValues({});
          }}
        >
          {record.fields.map((field) => (
            <Field key={field.id} label={`${field.label}${field.required ? ' *' : ''}`}>
              <input
                type={field.type}
                required={field.required}
                value={values[field.id] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              />
            </Field>
          ))}
          <Button type="submit">{t('Submit demo response')}</Button>
        </form>
      </section>
    );
  return (
    <section className="panel builder-panel">
      <div className="section-title">
        <h2>{t('Form builder')}</h2>
        <Badge tone={dirty ? 'amber' : 'green'}>{t(dirty ? 'Unsaved changes' : 'Saved')}</Badge>
      </div>
      <Field label={t('Title')}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      {fields.map((field, i) => (
        <div className="builder-field" key={field.id}>
          <span className="field-index">{i + 1}</span>
          <Field label={t('Field label')}>
            <input
              value={field.label}
              onChange={(e) =>
                setFields(
                  fields.map((f) => (f.id === field.id ? { ...f, label: e.target.value } : f)),
                )
              }
            />
          </Field>
          <Field label={t('Block type')}>
            <select
              value={field.type}
              onChange={(e) =>
                setFields(
                  fields.map((f) =>
                    f.id === field.id ? { ...f, type: e.target.value as 'text' | 'email' } : f,
                  ),
                )
              }
            >
              <option value="text">{t('Text')}</option>
              <option value="email">{t('Email')}</option>
            </select>
          </Field>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) =>
                setFields(
                  fields.map((f) => (f.id === field.id ? { ...f, required: e.target.checked } : f)),
                )
              }
            />
            {t('Required')}
          </label>
          <IconButton
            label={t('Delete')}
            disabled={fields.length < 2}
            onClick={() => setFields(fields.filter((f) => f.id !== field.id))}
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      ))}
      <div className="form-actions">
        <Button
          variant="secondary"
          onClick={() =>
            setFields([...fields, { id: uid(), label: '', type: 'text', required: false }])
          }
        >
          <Plus size={15} />
          {t('Add field')}
        </Button>
        <Button
          onClick={() => {
            if (!title.trim() || fields.some((f) => !f.label.trim()) || !fields.length)
              return notify('required', true);
            run(() =>
              repo.updateWorkspace((s) => {
                const f = s.forms.find((f) => f.id === record.id)!;
                f.title = title.trim();
                f.fields = fields;
              }),
            );
          }}
        >
          <Save size={15} />
          {t('Save builder')}
        </Button>
      </div>
    </section>
  );
}
function SurveyEditor({
  record,
  preview,
}: {
  record: Workspace['surveys'][number];
  preview: boolean;
}) {
  const { repo, t, run, notify } = useStore();
  const [title, setTitle] = useState(record.title);
  const [questions, setQuestions] = useState(() => structuredClone(record.questions));
  const [values, setValues] = useState<Record<string, string>>({});
  const dirty =
    title !== record.title || JSON.stringify(questions) !== JSON.stringify(record.questions);
  useUnsaved(dirty);
  if (preview)
    return (
      <section className="panel submission-preview">
        <Badge>{t('Local demo')}</Badge>
        <h2>{record.title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (record.questions.some((q) => !values[q.id]?.trim()))
              return notify('required', true);
            if (
              run(
                () =>
                  repo.updateWorkspace((s) =>
                    s.surveys
                      .find((f) => f.id === record.id)!
                      .responses.push({ id: uid(), at: new Date().toISOString(), values }),
                  ),
                'Response saved',
              )
            )
              setValues({});
          }}
        >
          {record.questions.map((q) =>
            q.type === 'choice' ? (
              <fieldset className="survey-choice" key={q.id}>
                <legend>{q.label} *</legend>
                {q.options.map((option) => (
                  <label className="radio-option" key={option}>
                    <input
                      required
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={values[q.id] === option}
                      onChange={() => setValues((v) => ({ ...v, [q.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ) : (
              <Field key={q.id} label={`${q.label} *`}>
                <textarea
                  required
                  rows={3}
                  value={values[q.id] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))}
                />
              </Field>
            ),
          )}
          <Button type="submit">{t('Submit demo response')}</Button>
        </form>
      </section>
    );
  return (
    <section className="panel builder-panel">
      <div className="section-title">
        <h2>{t('Surveys')}</h2>
        <Badge tone={dirty ? 'amber' : 'green'}>{t(dirty ? 'Unsaved changes' : 'Saved')}</Badge>
      </div>
      <Field label={t('Title')}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      {questions.map((q, i) => (
        <div className="survey-question-editor" key={q.id}>
          <div className="builder-field">
            <span className="field-index">{i + 1}</span>
            <Field label={t('Question')}>
              <input
                value={q.label}
                onChange={(e) =>
                  setQuestions(
                    questions.map((row) =>
                      row.id === q.id ? { ...row, label: e.target.value } : row,
                    ),
                  )
                }
              />
            </Field>
            <Field label={t('Block type')}>
              <select
                value={q.type}
                onChange={(e) =>
                  setQuestions(
                    questions.map((row) =>
                      row.id === q.id
                        ? {
                            ...row,
                            type: e.target.value as 'choice' | 'text',
                            options: e.target.value === 'choice' ? [t('Yes'), t('No')] : [],
                          }
                        : row,
                    ),
                  )
                }
              >
                <option value="text">{t('Text')}</option>
                <option value="choice">{t('Single choice')}</option>
              </select>
            </Field>
            <IconButton
              label={t('Delete')}
              disabled={questions.length < 2}
              onClick={() => setQuestions(questions.filter((row) => row.id !== q.id))}
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
          {q.type === 'choice' && (
            <Field label={t('Options')} help={t('One option per line')}>
              <textarea
                rows={3}
                value={q.options.join('\n')}
                onChange={(e) =>
                  setQuestions(
                    questions.map((row) =>
                      row.id === q.id ? { ...row, options: e.target.value.split('\n') } : row,
                    ),
                  )
                }
              />
            </Field>
          )}
        </div>
      ))}
      <div className="form-actions">
        <Button
          variant="secondary"
          onClick={() =>
            setQuestions([...questions, { id: uid(), label: '', type: 'text', options: [] }])
          }
        >
          <Plus size={15} />
          {t('Add question')}
        </Button>
        <Button
          onClick={() => {
            if (
              !title.trim() ||
              !questions.length ||
              questions.some(
                (q) =>
                  !q.label.trim() ||
                  (q.type === 'choice' &&
                    (q.options.filter((o) => o.trim()).length < 2 ||
                      new Set(q.options.map((o) => o.trim())).size !== q.options.length)),
              )
            )
              return notify('required', true);
            run(() =>
              repo.updateWorkspace((s) => {
                const f = s.surveys.find((f) => f.id === record.id)!;
                f.title = title.trim();
                f.questions = questions.map((q) => ({
                  ...q,
                  options: q.options.map((o) => o.trim()).filter(Boolean),
                }));
              }),
            );
          }}
        >
          <Save size={15} />
          {t('Save builder')}
        </Button>
      </div>
    </section>
  );
}
function ResponsesTable({
  record,
  survey,
}: {
  record: Workspace['forms'][number] | Workspace['surveys'][number];
  survey: boolean;
}) {
  const { t, data } = useStore();
  const labels = survey
    ? (record as Workspace['surveys'][number]).questions.map((q) => ({ id: q.id, label: q.label }))
    : (record as Workspace['forms'][number]).fields;
  return (
    <section className="panel table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t('Date')}</th>
              {labels.map((field) => (
                <th key={field.id}>{field.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {record.responses.map((r) => (
              <tr key={r.id}>
                <td>{businessDate(r.at, data.language, true)}</td>
                {labels.map((field) => (
                  <td key={field.id}>{r.values[field.id] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!record.responses.length && <Empty title={t('Responses')} />}
    </section>
  );
}
