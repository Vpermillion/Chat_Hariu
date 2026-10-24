import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Check,
  ArrowUpRight,
  MessageCircle,
  Instagram,
  Globe2,
  ShoppingBag,
  BookOpen,
  Headset,
  Plus,
  Minus,
  Menu,
  X,
  Workflow,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  Brand,
  LanguageToggle,
  Badge,
  Button,
  Modal,
  Field,
  Avatar,
  MessageBubble,
  ProductArt,
  CheckItem,
} from '../components/ui';
import { useStore } from '../store';
import { brand } from '../config';
import type { Message } from '../domain/models';

export function PricingCards() {
  const { data, t } = useStore();
  const [quote, setQuote] = useState(false);
  return (
    <>
      <div className="pricing-grid">
        {brand.plans.map((plan) => (
          <article className={`pricing-card ${plan.featured ? 'featured' : ''}`} key={plan.id}>
            {plan.featured && (
              <span className="recommended">
                {t('Recommended')} <Sparkles size={12} />
              </span>
            )}
            <span className="plan-symbol">
              {plan.id === 'start' ? '✳' : plan.id === 'grow' ? '↗' : '✦'}
            </span>
            <h3>{plan.name[data.language === 'mn' ? 0 : 1]}</h3>
            <p>{plan.description[data.language === 'mn' ? 0 : 1]}</p>
            <strong className="quote-price">{t('Get a quote')}</strong>
            <Button
              variant={plan.featured ? 'primary' : 'secondary'}
              onClick={() => setQuote(true)}
            >
              {t('Get a quote')}
              <ArrowUpRight size={16} />
            </Button>
            <div className="pricing-features">
              {plan.features.map((feature) => (
                <CheckItem key={feature} done>
                  {t(
                    (
                      {
                        inbox: 'Conversations',
                        bots: 'Bots',
                        knowledge: 'Knowledge & AI',
                        products: 'Products',
                        orders: 'Orders',
                        analytics: 'Analytics',
                        'live-agent': 'Live agent',
                        forms: 'Web forms',
                        surveys: 'Surveys',
                        bookings: 'Bookings',
                      } as Record<string, string>
                    )[feature],
                  )}
                </CheckItem>
              ))}
            </div>
          </article>
        ))}
      </div>
      {quote && (
        <Modal title={t('Get a quote')} onClose={() => setQuote(false)}>
          <p>
            {t(
              'Contact information is not configured. Explore the demo or add business contact details in brand configuration.',
            )}
          </p>
          {brand.contactEmail && <a href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>}
          <Link to="/app" className="button button-primary" onClick={() => setQuote(false)}>
            {t('Try the demo')}
            <ArrowRight size={16} />
          </Link>
        </Modal>
      )}
    </>
  );
}

export function MarketingLayout() {
  const { t } = useStore();
  const { pathname } = useLocation();
  const [nav, setNav] = useState(false);
  const [legal, setLegal] = useState('');
  return (
    <div className="marketing">
      <header className="marketing-nav">
        <Brand />
        <nav className={nav ? 'public-nav open' : 'public-nav'} aria-label={t('Features')}>
          <a href="/#features" onClick={() => setNav(false)}>
            {t('Features')}
          </a>
          <a href="/#how-it-works" onClick={() => setNav(false)}>
            {t('How it works')}
          </a>
          <Link to="/pricing" onClick={() => setNav(false)}>
            {t('Pricing')}
          </Link>
        </nav>
        <div className="marketing-nav-actions">
          <LanguageToggle />
          <Link className="login-link" to="/login">
            {t('Log in')}
          </Link>
          <Link className="button button-primary" to="/app">
            {t('Try the demo')}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label={t('Features')}
            onClick={() => setNav(!nav)}
          >
            {nav ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {pathname === '/pricing' ? (
        <main className="public-container pricing-page">
          <Badge tone="blue">{t('Pricing')}</Badge>
          <h1>{t('Simple plans, room to grow.')}</h1>
          <p className="section-intro">
            {t('Plans are a preview. Contact details and final prices are not configured yet.')}
          </p>
          <PricingCards />
          <FAQ />
        </main>
      ) : (
        <Landing />
      )}
      <footer className="marketing-footer public-container">
        <div>
          <Brand />
          <p>{t('A working title for a new kind of business assistant.')}</p>
          <small>
            © {new Date().getFullYear()} {brand.name}
          </small>
        </div>
        <div className="footer-links">
          <Link to="/pricing">{t('Pricing')}</Link>
          <button onClick={() => setLegal('Privacy')}>{t('Privacy')}</button>
          <button onClick={() => setLegal('Terms')}>{t('Terms')}</button>
          <Link to="/app">{t('Try the demo')} ↗</Link>
        </div>
      </footer>
      {legal && (
        <Modal title={`${t(legal)} · ${t('Draft legal content')}`} onClose={() => setLegal('')}>
          <p>
            {t(
              'This is draft information, not approved legal terms. Demo records stay in your browser. Do not enter real personal data. Reset demo to clear local records.',
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}
function Landing() {
  const { t, data } = useStore();
  const w = data.workspaces.nuudel;
  const [industry, setIndustry] = useState(0);
  const examples: Message[][] = [
    w.conversations[0].messages.slice(0, 2),
    [
      {
        id: 'ex1',
        role: 'customer',
        text:
          data.language === 'mn'
            ? 'Өдөр тутам хэрэглэх серум санал болгооч 🌿'
            : 'Can you suggest a daily serum? 🌿',
        at: '',
      },
      {
        id: 'ex2',
        role: 'bot',
        text:
          data.language === 'mn'
            ? 'Чийгшүүлэгч серум 30 мл — 59,000₮. Та арьсны төрлөө хэлж өгнө үү?'
            : 'Daily serum 30 ml — 59,000₮. What is your skin type?',
        at: '',
        productId: 'p1',
      },
    ],
    [
      {
        id: 'ex3',
        role: 'customer',
        text:
          data.language === 'mn'
            ? 'Маргааш зөвлөгөө авах цаг байна уу?'
            : 'Can I book a consultation tomorrow?',
        at: '',
      },
      {
        id: 'ex4',
        role: 'bot',
        text:
          data.language === 'mn'
            ? 'Мэдээж! Та өөрт тохирох цагаа сонгоорой. Демо хуанлиас боломжтой цаг харах боломжтой.'
            : 'Of course! Choose a time that suits you in the demo calendar.',
        at: '',
      },
    ],
  ];
  return (
    <main>
      <section className="hero public-container">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="status-dot" />
            {t('Made for the way Mongolian businesses work')}
            <ArrowUpRight size={13} />
          </span>
          <h1>
            {data.language === 'mn' ? (
              <>
                Бизнесээ урагшлуул.
                <br />
                <span>Яриа бүрээс</span> эхэл.
              </>
            ) : (
              <>
                Grow your business.
                <br />
                Start with <span>a conversation.</span>
              </>
            )}
          </h1>
          <p>
            {t(
              'Bring your messages, product knowledge and orders together. Give your customers a helpful answer, and your team a little breathing room.',
            )}
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-lg" to="/app">
              {t('Try the demo')}
              <ArrowRight size={18} />
            </Link>
            <a className="button button-secondary button-lg" href="#how-it-works">
              {t('How it works')}
            </a>
          </div>
          <small className="hero-note">
            <ShieldCheck size={14} />
            {t('Explore with sample data · No sign-up needed')}
          </small>
        </div>
        <div className="hero-product">
          <div className="hero-window">
            <div className="window-toolbar">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>{brand.name} / inbox</span>
              <Badge tone="green">
                <span className="status-dot" />
                {t('Demo')}
              </Badge>
            </div>
            <div className="hero-chat-heading">
              <div className="business-avatar">Н</div>
              <div>
                <strong>Нүүдэл Store</strong>
                <small>Messenger · {t('Demo channel')}</small>
              </div>
              <Sparkles size={18} />
            </div>
            <div className="hero-messages">
              {w.conversations[0].messages.slice(0, 2).map((m) => (
                <MessageBubble key={m.id} message={m} products={w.products} compact />
              ))}
              <div className="quick-replies">
                <span>{data.language === 'mn' ? 'Захиалга өгөх' : 'Place an order'}</span>
                <span>{data.language === 'mn' ? 'Хүргэлтийн мэдээлэл' : 'Delivery details'}</span>
              </div>
            </div>
            <div className="hero-compose">
              <span>{t('Write a reply…')}</span>
              <span className="send-square">
                <Send size={15} />
              </span>
            </div>
          </div>
          <div className="floating-stat">
            <div className="stat-icon green">
              <ShoppingBag size={19} />
            </div>
            <div>
              <strong>{t('Create order draft')}</strong>
              <small>Essential футболк · 49,000₮</small>
            </div>
            <span className="check-circle">
              <Check size={13} />
            </span>
          </div>
          <div className="floating-ai">
            <Sparkles size={16} />
            {t('Questions answered with care.')}
          </div>
        </div>
      </section>
      <section className="channel-strip public-container">
        <span>{t('Your team and your assistant, working together.')}</span>
        <div>
          <span>
            <MessageCircle size={19} />
            Messenger<Badge>{t('Demo')}</Badge>
          </span>
          <span>
            <Instagram size={19} />
            Instagram<Badge>{t('Demo')}</Badge>
          </span>
          <span>
            <Globe2 size={19} />
            Web chat<Badge>{t('Planned integration')}</Badge>
          </span>
        </div>
      </section>
      <section id="features" className="public-section inbox-section">
        <div className="public-container">
          <div className="section-heading">
            <p className="eyebrow">
              <span />
              {t('Working together')}
            </p>
            <h2>{t('One inbox. Every little detail.')}</h2>
            <p>{t('The full conversation, with the context to help.')}</p>
          </div>
          <InboxShowcase />
          <div className="showcase-caption">
            <span>
              <Check size={14} />
              {t('Demo data · Browser only')}
            </span>
            <Link to="/app/inbox" className="text-link">
              {t('Open inbox')}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="public-section public-container">
        <div className="section-heading">
          <p className="eyebrow">{t('How it works')}</p>
          <h2>{t('Four simple steps. One helpful assistant.')}</h2>
        </div>
        <div className="steps-grid">
          {[
            [
              'Add your knowledge',
              'Tell your assistant about your business, FAQs and products.',
              BookOpen,
            ],
            [
              'Choose a channel',
              'Explore a demo channel; real Meta connections are planned.',
              MessageCircle,
            ],
            [
              'Test a conversation',
              'Check answers using your saved business information.',
              Sparkles,
            ],
            ['Publish your flow', 'Validate and publish your local conversation flow.', Workflow],
          ].map(([title, text, Icon], i) => {
            const StepIcon = Icon as typeof BookOpen;
            return (
              <article key={i}>
                <span className="step-number">0{i + 1}</span>
                <div className="step-icon">
                  <StepIcon size={22} />
                </div>
                <h3>{t(title as string)}</h3>
                <p>{t(text as string)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="feature-section public-container">
        <div className="feature-copy">
          <p className="eyebrow">
            <BookOpen size={15} />
            {t('Knowledge & AI')}
          </p>
          <h2>{t('Knows your business.')}</h2>
          <p>
            {t(
              'Keep your FAQs, hours and products in one place. Edit once, then test the next answer.',
            )}
          </p>
          <Link className="text-link" to="/app/knowledge">
            {t('Test your assistant')}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="knowledge-preview">
          <div className="preview-card-heading">
            <BookOpen size={19} />
            <strong>{t('Published knowledge')}</strong>
            <Badge tone="green">{w.knowledge.filter((k) => k.published).length}</Badge>
          </div>
          {w.knowledge
            .filter((k) => k.kind === 'faq')
            .map((k) => (
              <div className="knowledge-preview-row" key={k.id}>
                <div className="file-icon">
                  <BookOpen size={16} />
                </div>
                <div>
                  <strong>{k.title}</strong>
                  <small>{k.content}</small>
                </div>
                <Badge tone={k.published ? 'green' : 'neutral'}>
                  {t(k.published ? 'Published' : 'Draft')}
                </Badge>
              </div>
            ))}
          <div className="knowledge-preview-footer">
            <Sparkles size={14} />
            {t('Replies use published knowledge and current products.')}
          </div>
        </div>
      </section>
      <section className="feature-section feature-reverse public-container">
        <div className="takeover-preview">
          <div className="mini-conversation">
            <MessageBubble
              compact
              message={{
                id: 'demo-note',
                role: 'note',
                text:
                  data.language === 'mn'
                    ? 'L размерийг маргааш бэлдэж өгнө. Номин хариуцав.'
                    : 'Prepare size L tomorrow. Assigned to Nomin.',
                at: '',
              }}
            />
            <div className="handoff-card">
              <div className="stat-icon blue">
                <Headset size={22} />
              </div>
              <div>
                <strong>{t('Take over')}</strong>
                <small>{t('Assistant paused')}</small>
              </div>
              <Avatar name="Номин" />
            </div>
            <div className="demo-order-card">
              <span>
                <ShoppingBag size={16} />
                ORD-1001
              </span>
              <strong>49,000₮</strong>
              <Badge tone="amber">{t('Unverified')}</Badge>
            </div>
          </div>
        </div>
        <div className="feature-copy">
          <p className="eyebrow">
            <Headset size={15} />
            {t('Human handoffs')}
          </p>
          <h2>{t('Ready when a person is needed.')}</h2>
          <p>
            {t(
              'Take over a conversation, leave a private note and pass the context to a teammate.',
            )}
          </p>
          <Link className="text-link" to="/app/live-agent">
            {t('Live agent')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="public-section industry-section">
        <div className="public-container industry-grid">
          <div className="feature-copy">
            <p className="eyebrow">{t('Your products. Their next favorite.')}</p>
            <h2>{t('A helpful fit for your business.')}</h2>
            <p>{t('Share product details and build an order directly from a conversation.')}</p>
            <div className="industry-tabs" role="tablist">
              {['Clothing', 'Beauty', 'Services'].map((label, i) => (
                <button
                  role="tab"
                  aria-selected={industry === i}
                  className={industry === i ? 'active' : ''}
                  key={label}
                  onClick={() => setIndustry(i)}
                >
                  {t(label)}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="industry-preview">
            <div className="hero-chat-heading">
              <Avatar name={['Нүүдэл', 'Гоо', 'Саруул'][industry]} />
              <div>
                <strong>{['Нүүдэл Store', 'Гоо студио', 'Саруул зөвлөгөө'][industry]}</strong>
                <small>{t('Demo response')}</small>
              </div>
            </div>
            <div className="industry-messages">
              {examples[industry].map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  products={
                    industry === 1 ? data.workspaces.goo.products : industry === 0 ? w.products : []
                  }
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="public-section public-container">
        <div className="section-heading">
          <p className="eyebrow">{t('Pricing')}</p>
          <h2>{t('Simple plans, room to grow.')}</h2>
          <p>
            {t('Plans are a preview. Contact details and final prices are not configured yet.')}
          </p>
        </div>
        <PricingCards />
      </section>
      <FAQ />
      <section className="public-container">
        <div className="final-cta">
          <div className="cta-star">✳</div>
          <p className="eyebrow">{t('A little help. A lot more possibility.')}</p>
          <h2>{t('Let your next conversation go a little further.')}</h2>
          <p>{t('See what a little help can do for your business.')}</p>
          <Link className="button button-primary button-lg" to="/app">
            {t('Try the demo')}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
function InboxShowcase() {
  const { data, t } = useStore();
  const w = data.workspaces.nuudel;
  const [selected, setSelected] = useState(w.conversations[0].id);
  const conversation = w.conversations.find((c) => c.id === selected) || w.conversations[0];
  const contact = w.contacts.find((c) => c.id === conversation.contactId)!;
  return (
    <div className="inbox-showcase">
      <div className="showcase-rail">
        <img src={brand.logo} alt="" />
        <MessageCircle />
        <ShoppingBag />
        <BookOpen />
        <div className="rail-bottom">
          <Avatar name="Номин" size="small" />
        </div>
      </div>
      <div className="showcase-list">
        <h3>
          {t('Conversations')}
          <Badge tone="blue">{w.conversations.length}</Badge>
        </h3>
        <div className="showcase-filter">
          {t('All channels')}
          <span>⌄</span>
        </div>
        {w.conversations.slice(0, 4).map((c) => {
          const p = w.contacts.find((contact) => contact.id === c.contactId)!;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`showcase-list-row ${selected === c.id ? 'active' : ''}`}
            >
              <Avatar name={p.name} />
              <span>
                <strong>
                  {p.name}
                  <small>{c.source}</small>
                </strong>
                <span>{c.messages.at(-1)?.text}</span>
              </span>
              {c.unread > 0 && <i />}
            </button>
          );
        })}
      </div>
      <div className="showcase-thread">
        <div className="showcase-thread-heading">
          <div>
            <strong>{contact.name}</strong>
            <small>Messenger · {t('Demo')}</small>
          </div>
          <Badge tone={conversation.human ? 'amber' : 'green'}>
            {t(conversation.human ? 'Human' : 'Assistant')}
          </Badge>
        </div>
        <div className="showcase-messages">
          {conversation.messages.map((m) => (
            <MessageBubble message={m} products={w.products} key={m.id} compact />
          ))}
        </div>
        <Link className="showcase-compose" to="/app/inbox">
          {t('Write a reply…')}
          <ArrowRight size={18} />
        </Link>
      </div>
      <div className="showcase-details">
        <Avatar name={contact.name} size="large" />
        <h4>{contact.name}</h4>
        <Badge>{t('Customer')}</Badge>
        <hr />
        <small>{t('Tags')}</small>
        <div className="tags">
          {contact.tags.map((tag) => (
            <Badge key={tag} tone="purple">
              {tag}
            </Badge>
          ))}
        </div>
        <small>{t('Product')}</small>
        <ProductArt art="shirt" />
        <strong>Essential футболк</strong>
        <p>49,000₮</p>
        <Link className="button button-secondary" to="/app/orders">
          {t('Create order draft')}
          <Plus size={14} />
        </Link>
      </div>
    </div>
  );
}
function FAQ() {
  const { t } = useStore();
  const [open, setOpen] = useState<number | null>(0);
  const questions = [
    [
      'Is this connected to Facebook?',
      'No. This is an interactive demo. Real Meta connections, permissions and delivery require a verified server integration.',
    ],
    [
      'Do I need an account?',
      'You can explore every demo module without credentials. Changes are saved only in this browser.',
    ],
    [
      'Is the assistant using real AI?',
      'The demo matches your published FAQs and products locally. Unknown questions are clarified or handed to a person.',
    ],
    [
      'Can I take payments?',
      'Orders and payment states are simulated. Real payment confirmation is a future server feature.',
    ],
  ];
  return (
    <section className="public-section faq-section public-container">
      <div>
        <p className="eyebrow">FAQ</p>
        <h2>{t('Frequently asked questions')}</h2>
      </div>
      <div>
        {questions.map(([q, a], i) => (
          <article className="faq-item" key={q}>
            <button
              aria-expanded={open === i}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {t(q)}
              {open === i ? <Minus size={19} /> : <Plus size={19} />}
            </button>
            {open === i && <p id={`faq-${i}`}>{t(a)}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
export function AuthPage({ register = false }: { register?: boolean }) {
  const { t } = useStore();
  const navigate = useNavigate();
  return (
    <div className="auth-layout">
      <div className="auth-top">
        <Brand />
        <LanguageToggle />
      </div>
      <main className="auth-card">
        <Badge tone="amber">{t('Demo access')}</Badge>
        <h1>{t(register ? 'Get started' : 'Welcome back')}</h1>
        <p>{t('No real account or password is created. Use fictional information to explore.')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/app');
          }}
        >
          {register && (
            <>
              <Field label={t('Your name')}>
                <input required autoComplete="off" placeholder="Номин" />
              </Field>
              <Field label={t('Business name')}>
                <input required autoComplete="off" placeholder="Жишээ дэлгүүр" />
              </Field>
            </>
          )}
          <Field label={t('Demo email')}>
            <input required type="email" autoComplete="off" placeholder="demo@example.com" />
          </Field>
          <Button type="submit">
            {t('Enter demo')}
            <ArrowRight size={17} />
          </Button>
        </form>
        <div className="auth-divider">
          <span>{t('Optional')}</span>
        </div>
        <Link className="button button-secondary" to="/app">
          {t('Try the demo')}
        </Link>
        <Link className="text-link" to={register ? '/login' : '/register'}>
          {t(register ? 'Log in' : 'Register')}
          <ArrowUpRight size={14} />
        </Link>
      </main>
      <Link className="auth-back" to="/">
        ← {t('Back to website')}
      </Link>
    </div>
  );
}
