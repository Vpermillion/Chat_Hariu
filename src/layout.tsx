import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  MessagesSquare,
  Headset,
  UsersRound,
  Workflow,
  BookOpen,
  Megaphone,
  ShoppingBag,
  ClipboardList,
  CalendarDays,
  FileText,
  ListChecks,
  CircleHelp,
  ChartNoAxesCombined,
  Send,
  Radio,
  Settings2,
  CreditCard,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from './store';
import { Brand, Badge, LanguageToggle, IconButton, Confirm, Modal, Avatar } from './components/ui';
import { entitlements, brand } from './config';
import { useMediaQuery } from './hooks';

export const navigation: {
  group: string;
  items: { path: string; label: string; icon: LucideIcon; key: string }[];
}[] = [
  {
    group: 'Overview',
    items: [
      { path: '', label: 'Dashboard', icon: LayoutDashboard, key: 'overview' },
      { path: '/bots', label: 'Bots', icon: Bot, key: 'bots' },
    ],
  },
  {
    group: 'Conversations',
    items: [
      { path: '/inbox', label: 'Conversations', icon: MessagesSquare, key: 'inbox' },
      { path: '/live-agent', label: 'Live agent', icon: Headset, key: 'live-agent' },
      { path: '/contacts', label: 'Contacts', icon: UsersRound, key: 'contacts' },
    ],
  },
  {
    group: 'Bot setup',
    items: [
      { path: '/flows', label: 'Message blocks', icon: Workflow, key: 'flows' },
      { path: '/knowledge', label: 'Knowledge & AI', icon: BookOpen, key: 'knowledge' },
      { path: '/posts', label: 'Post automation', icon: Megaphone, key: 'posts' },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { path: '/products', label: 'Products', icon: ShoppingBag, key: 'products' },
      { path: '/orders', label: 'Orders', icon: ClipboardList, key: 'orders' },
      { path: '/bookings', label: 'Bookings', icon: CalendarDays, key: 'bookings' },
    ],
  },
  {
    group: 'Content',
    items: [
      { path: '/pages', label: 'Static pages', icon: FileText, key: 'pages' },
      { path: '/forms', label: 'Web forms', icon: ListChecks, key: 'forms' },
      { path: '/surveys', label: 'Surveys', icon: CircleHelp, key: 'surveys' },
    ],
  },
  {
    group: 'Management',
    items: [
      { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined, key: 'analytics' },
      { path: '/messaging', label: 'Messaging', icon: Send, key: 'messaging' },
      { path: '/channels', label: 'Channels', icon: Radio, key: 'channels' },
      { path: '/settings', label: 'Settings', icon: Settings2, key: 'settings' },
      { path: '/billing', label: 'Plan & usage', icon: CreditCard, key: 'billing' },
    ],
  },
];
export function DashboardLayout() {
  const { data, w, repo, t, run } = useStore();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState('');
  const [reset, setReset] = useState(false);
  const [features, setFeatures] = useState(false);
  const mobile = useMediaQuery('(max-width: 800px)');
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!drawer || !mobile) return;
    const previous = document.activeElement as HTMLElement;
    const el = sidebar.current;
    const focusable = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), select, input, [tabindex="0"]',
        ) || [],
      ).filter((item) => item.getClientRects().length > 0);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(false);
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      previous?.focus();
    };
  }, [drawer, mobile]);
  const business = data.businesses.find((b) => b.id === data.activeBusinessId)!;
  const current = navigation
    .flatMap((g) => g.items)
    .find((item) => `/app${item.path}` === location.pathname);
  const unread = w.conversations.reduce((sum, c) => sum + c.unread, 0);
  return (
    <div className="dashboard-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
          main?.scrollIntoView({ block: 'start' });
        }}
      >
        {t('Dashboard')}
      </a>
      {drawer && (
        <button
          className="sidebar-overlay"
          aria-label={t('Close')}
          onClick={() => setDrawer(false)}
        />
      )}
      <aside
        ref={sidebar}
        inert={mobile && !drawer}
        aria-label={t('Dashboard')}
        className={`sidebar ${drawer ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-brand">
          <Brand />
          <IconButton label={t('Close')} className="mobile-only" onClick={() => setDrawer(false)}>
            <X size={20} />
          </IconButton>
        </div>
        <div className="workspace-picker">
          <div className="business-avatar">{business.initials}</div>
          <label>
            <span className="sr-only">{t('Choose business')}</span>
            <select
              aria-label={t('Choose business')}
              value={data.activeBusinessId}
              onChange={(e) => {
                run(
                  () =>
                    repo.transact((d) => {
                      d.activeBusinessId = e.target.value;
                    }),
                  'Business switched',
                );
                setDrawer(false);
              }}
            >
              {data.businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <small>{t('Demo workspace')}</small>
          </label>
        </div>
        <label className="bot-picker">
          <Bot size={14} />
          <span className="sr-only">{t('Choose bot')}</span>
          <select
            aria-label={t('Choose bot')}
            value={
              w.bots.some((b) => b.id === w.selectedBotId && !b.archived) ? w.selectedBotId : ''
            }
            onChange={(e) =>
              run(
                () =>
                  repo.updateWorkspace((s) => {
                    s.selectedBotId = e.target.value;
                  }),
                '',
              )
            }
          >
            <option value="" disabled>
              {t('No active bot')}
            </option>
            {w.bots
              .filter((b) => !b.archived)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </label>
        <nav aria-label={t('Dashboard')} className="sidebar-nav">
          {navigation.map((group) => (
            <div className="nav-group" key={group.group}>
              <p>{t(group.group)}</p>
              {group.items.map((item) => {
                const entitlement = entitlements.find((e) => e.key === item.key);
                const Icon = item.icon;
                return (
                  <div className="nav-row" key={item.key}>
                    <NavLink end to={`/app${item.path}`} onClick={() => setDrawer(false)}>
                      <Icon size={18} strokeWidth={1.7} />
                      <span>{t(item.label)}</span>
                      {item.key === 'inbox' && unread > 0 && (
                        <span className="nav-count">{unread}</span>
                      )}
                    </NavLink>
                    {entitlement?.tier !== 'included' && entitlement && (
                      <button
                        className={`nav-entitlement ${entitlement.tier}`}
                        aria-label={`${t('Feature access')}: ${t(item.label)}`}
                        onClick={() => setFeatures(true)}
                      >
                        {entitlement.tier === 'pro' ? 'Pro' : '+'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <Sparkles size={19} />
            <span>
              <strong>{t('A little help. A lot more possibility.')}</strong>
              <Link to="/app/knowledge">
                {t('Test your assistant')} <span>↗</span>
              </Link>
            </span>
          </div>
          <Link className="website-link" to="/">
            <ExternalLink size={14} />
            {t('View website')}
          </Link>
        </div>
      </aside>
      <div className="dashboard-body" inert={mobile && drawer}>
        <header className="topbar">
          <div className="topbar-left">
            <IconButton
              label={t('Dashboard')}
              className="mobile-only"
              onClick={() => setDrawer(true)}
            >
              <Menu size={22} />
            </IconButton>
            <span className="breadcrumb-business">{business.name}</span>
            <span className="breadcrumb-slash">/</span>
            <span>{t(current?.label || 'Dashboard')}</span>
          </div>
          <div className="topbar-right">
            <Link to="/app/inbox" className="topbar-search" aria-label={t('Search conversations')}>
              <Search size={18} />
            </Link>
            <Badge tone="amber">
              <span className="status-dot" />
              {t('Demo')}
            </Badge>
            <LanguageToggle />
            <div className="dropdown-anchor">
              <IconButton
                label={t('Notifications')}
                onClick={() => setMenu(menu === 'notifications' ? '' : 'notifications')}
                aria-expanded={menu === 'notifications'}
              >
                <Bell size={19} />
                {unread > 0 && w.notifications && <i className="notification-dot" />}
              </IconButton>
              {menu === 'notifications' && (
                <div className="dropdown notification-menu">
                  <strong>{t('Notifications')}</strong>
                  {w.notifications && unread ? (
                    <Link to="/app/inbox" onClick={() => setMenu('')}>
                      {t('Unanswered')} <Badge tone="blue">{unread}</Badge>
                    </Link>
                  ) : (
                    <p>{t('No new notifications')}</p>
                  )}
                </div>
              )}
            </div>
            <div className="dropdown-anchor">
              <button
                className="account-button"
                aria-label={t('Account')}
                aria-expanded={menu === 'account'}
                onClick={() => setMenu(menu === 'account' ? '' : 'account')}
              >
                <Avatar name="Номин" size="small" />
                <ChevronDown size={13} />
              </button>
              {menu === 'account' && (
                <div className="dropdown">
                  <p>{t('Demo access')}</p>
                  <Link to="/app/settings" onClick={() => setMenu('')}>
                    <Settings2 size={15} />
                    {t('Settings')}
                  </Link>
                  <button
                    onClick={() => {
                      setReset(true);
                      setMenu('');
                    }}
                  >
                    <RotateCcw size={15} />
                    {t('Reset demo')}
                  </button>
                  <Link to="/" onClick={() => setMenu('')}>
                    <LogOut size={15} />
                    {t('View website')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        {repo.recovery && (
          <div className="recovery-banner" role="status">
            {t(
              'Stored data was unreadable or from an unsupported version. Sample data was loaded.',
            )}
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          key={data.activeBusinessId}
          className={`dashboard-main ${location.pathname.endsWith('/inbox') || location.pathname.endsWith('/live-agent') ? 'inbox-main' : ''}`}
        >
          <Outlet />
        </main>
        <footer className="dashboard-footer">
          <span>
            © {new Date().getFullYear()} {brandName()}
          </span>
          <span>
            {t('Demo data · Browser only')}
            <span className="status-dot" />
          </span>
        </footer>
      </div>
      {reset && (
        <Confirm
          title={t('Reset all local demo records?')}
          message={t('This replaces changes in both demo businesses with sample data.')}
          onClose={() => setReset(false)}
          onConfirm={() => {
            if (run(() => repo.reset(), 'Demo reset')) setReset(false);
          }}
        />
      )}
      {features && (
        <Modal title={t('Feature access')} onClose={() => setFeatures(false)}>
          <p>
            {t(
              'Pro features are included in paid plan examples. Add-ons are optional modules. Every module is explorable in this demo; no purchase is made.',
            )}
          </p>
          <Link
            className="button button-primary"
            to="/app/billing"
            onClick={() => setFeatures(false)}
          >
            {t('Explore plans')}
          </Link>
        </Modal>
      )}
    </div>
  );
}
function brandName() {
  return brand.name;
}
