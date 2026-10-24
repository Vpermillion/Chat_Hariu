import { useEffect, useRef, useId } from 'react';
import type { ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from 'react';
import {
  X,
  Search,
  Inbox,
  ArrowUpRight,
  Sparkles,
  Check,
  ArrowRight,
  MessageCircle,
  Instagram,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import type { Message, Product, Conversation } from '../domain/models';
import { businessDate, money } from '../domain/services';
import { brand } from '../config';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'purple' | 'red';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label={brand.name}>
      <img src={brand.logo} width="36" height="36" alt="" />
      {!compact && (
        <span>
          {brand.name}
          <span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function LanguageToggle() {
  const { data, repo, run } = useStore();
  return (
    <button
      className="language-toggle"
      aria-label="Change language / Хэл солих"
      onClick={() =>
        run(
          () =>
            repo.transact((d) => {
              d.language = d.language === 'mn' ? 'en' : 'mn';
            }),
          '',
        )
      }
    >
      <span className={data.language === 'mn' ? 'selected' : ''}>MN</span>
      <span className={data.language === 'en' ? 'selected' : ''}>EN</span>
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = ref.current!.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <IconButton label={useStore().t('Close')} onClick={onClose}>
          <X size={19} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  help,
  className = '',
}: {
  label: string;
  children: ReactNode;
  help?: string;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useStore();
  return (
    <label className="search">
      <Search size={17} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('Search')}
        aria-label={placeholder || t('Search')}
      />
      {value && (
        <button aria-label={t('Close')} onClick={() => onChange('')}>
          <X size={15} />
        </button>
      )}
    </label>
  );
}
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function Empty({ title, children }: { title?: string; children?: ReactNode }) {
  const { t } = useStore();
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={24} />
      </div>
      <h3>{title || t('No results')}</h3>
      <p>{t('Try a different search or create your first record.')}</p>
      {children}
    </div>
  );
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}
export function Avatar({ name, size = '' }: { name: string; size?: 'small' | 'large' | '' }) {
  const tone = (name.codePointAt(0) || 0) % 5;
  return (
    <span className={`avatar avatar-${tone} avatar-${size}`} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}
export function ChannelIcon({ channel }: { channel: Conversation['channel'] }) {
  return (
    <span className={`channel-icon channel-${channel}`}>
      {channel === 'instagram' ? <Instagram size={13} /> : <MessageCircle size={13} />}
    </span>
  );
}
export function channelName(channel: Conversation['channel']) {
  return channel === 'messenger' ? 'Messenger' : channel === 'instagram' ? 'Instagram' : 'Web chat';
}
export function ProductArt({
  art = 'shirt',
  className = '',
}: {
  art?: Product['art'];
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <div className={`product-art art-${art} ${className}`}>
      <svg viewBox="0 0 220 200" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor={art === 'serum' ? '#c2d4bd' : '#dddcd6'} />
          </linearGradient>
          <filter id={`${id}s`}>
            <feDropShadow dx="0" dy="9" stdDeviation="6" floodOpacity=".10" />
          </filter>
        </defs>
        {art === 'shirt' ? (
          <g filter={`url(#${id}s)`}>
            <path
              d="m70 40 24-9q16 12 32 0l24 9 36 35-25 25-17-13 5 81H71l5-81-17 13-25-25Z"
              fill={`url(#${id})`}
              stroke="#d8d8d4"
            />
            <path
              d="M94 32q2 24 16 24t16-24M77 88l-6-23m73 23 6-23M74 159h72"
              fill="none"
              stroke="#d6d5cf"
              strokeWidth="2"
            />
            <text
              x="110"
              y="101"
              textAnchor="middle"
              fontSize="9"
              fill="#9b9d95"
              fontFamily="sans-serif"
              letterSpacing="3"
            >
              NUUDEL
            </text>
          </g>
        ) : art === 'bag' ? (
          <g filter={`url(#${id}s)`}>
            <path d="M63 70h94l12 101H51Z" fill="#d8c5a5" stroke="#baa885" />
            <path d="M84 81V51q0-29 26-29t26 29v30" fill="none" stroke="#c0ac88" strokeWidth="11" />
            <path d="M61 78h98M58 160h103" stroke="#b9a380" fill="none" />
            <text
              x="110"
              y="124"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="11"
              fill="#6e765e"
              letterSpacing="3"
            >
              EVERYDAY
            </text>
          </g>
        ) : (
          <g filter={`url(#${id}s)`}>
            <rect x="88" y="25" width="44" height="39" rx="7" fill="#405e4b" />
            <rect
              x="77"
              y="62"
              width="66"
              height="113"
              rx="14"
              fill={`url(#${id})`}
              stroke="#a1b69f"
            />
            <rect x="81" y="98" width="58" height="49" rx="1" fill="#f6f4e7" />
            <text
              x="110"
              y="118"
              textAnchor="middle"
              fontSize="10"
              fill="#405e4b"
              fontFamily="sans-serif"
              letterSpacing="2"
            >
              GOO
            </text>
            <text x="110" y="133" textAnchor="middle" fontSize="7" fill="#6b7a6d">
              DAILY SERUM
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
export function ProductMini({ product }: { product: Product }) {
  return (
    <div className="product-mini">
      <ProductArt art={product.art} />
      <div>
        <strong>{product.name}</strong>
        <span>{money(product.price)}</span>
        <small>{product.variants.map((v) => v.size).join(' · ')}</small>
      </div>
      <ArrowUpRight size={16} />
    </div>
  );
}
export function MessageBubble({
  message,
  products = [],
  compact = false,
}: {
  message: Message;
  products?: Product[];
  compact?: boolean;
}) {
  const { t, data } = useStore();
  const product = products.find((p) => p.id === message.productId);
  return (
    <div className={`message-row message-${message.role} ${compact ? 'message-compact' : ''}`}>
      <div className="message-bubble">
        {message.role === 'note' && <small className="message-role">{t('Private note')}</small>}
        {message.text && <p>{message.text}</p>}
        {product && <ProductMini product={product} />}
      </div>
      <small className="message-meta">
        {message.role === 'bot' && (
          <>
            <Sparkles size={11} /> {t('Demo response')} ·{' '}
          </>
        )}
        {message.role === 'staff' && <>{t('Local reply')} · </>}
        {!compact && businessDate(message.at, data.language, true)}
      </small>
    </div>
  );
}
export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function CheckItem({ children, done }: { children: ReactNode; done: boolean }) {
  return (
    <span className={`check-item ${done ? 'done' : ''}`}>
      <span>{done ? <Check size={12} /> : null}</span>
      {children}
    </span>
  );
}
export function Confirm({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useStore();
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{message}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('Reset demo')}
        </Button>
      </div>
    </Modal>
  );
}
