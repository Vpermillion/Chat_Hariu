import { StrictMode, Component, useEffect, lazy, Suspense } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { DashboardLayout } from './layout';

import { brand } from './config';
import './styles.css';

// GitHub Pages does not provide an SPA rewrite. Hash routes survive direct links and refreshes.
const AppRouter = import.meta.env.MODE === 'github-pages' ? HashRouter : BrowserRouter;

const MarketingLayout = lazy(() =>
  import('./pages/Marketing').then((module) => ({ default: module.MarketingLayout })),
);
const AuthPage = lazy(() =>
  import('./pages/Marketing').then((module) => ({ default: module.AuthPage })),
);
const OverviewPage = lazy(() =>
  import('./pages/OverviewBots').then((module) => ({ default: module.OverviewPage })),
);
const BotsPage = lazy(() =>
  import('./pages/OverviewBots').then((module) => ({ default: module.BotsPage })),
);
const InboxPage = lazy(() =>
  import('./pages/Inbox').then((module) => ({ default: module.InboxPage })),
);
const ContactsPage = lazy(() =>
  import('./pages/Inbox').then((module) => ({ default: module.ContactsPage })),
);
const KnowledgePage = lazy(() =>
  import('./pages/Knowledge').then((module) => ({ default: module.KnowledgePage })),
);
const ProductsPage = lazy(() =>
  import('./pages/Commerce').then((module) => ({ default: module.ProductsPage })),
);
const OrdersPage = lazy(() =>
  import('./pages/Commerce').then((module) => ({ default: module.OrdersPage })),
);
const FlowsPage = lazy(() =>
  import('./pages/Flows').then((module) => ({ default: module.FlowsPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.SettingsPage })),
);
const ChannelsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.ChannelsPage })),
);
const FormsPage = lazy(() =>
  import('./pages/Content').then((module) => ({ default: module.FormsPage })),
);
const PagesPage = lazy(() =>
  import('./pages/Content').then((module) => ({ default: module.PagesPage })),
);
const AnalyticsPage = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.AnalyticsPage })),
);
const BillingPage = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.BillingPage })),
);
const BookingsPage = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.BookingsPage })),
);
const MessagingPage = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.MessagingPage })),
);
const PostsPage = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.PostsPage })),
);

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error', error.message, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-boundary">
          <img src={brand.logo} width="44" alt="" />
          <h1>Түр алдаа гарлаа / Something went wrong</h1>
          <p>Дахин ачаална уу. / Please reload the application.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Дахин ачаалах / Reload
          </button>
        </main>
      );
    return this.props.children;
  }
}
function ScrollManager() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!new URLSearchParams(search).has('section')) window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}
function NotFound() {
  const { t } = useStore();
  return (
    <div className="empty">
      <h1>404</h1>
      <h2>{t('Page not found')}</h2>
      <Link className="button button-primary" to="/app">
        {t('Go to dashboard')}
      </Link>
    </div>
  );
}
function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <AppRouter>
          <ScrollManager />
          <Suspense
            fallback={
              <div className="app-loading" role="status">
                <img src={brand.logo} alt="" width="36" /> Ачаалж байна… / Loading…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<MarketingLayout />} />
              <Route path="/pricing" element={<MarketingLayout />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage register />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="bots" element={<BotsPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="live-agent" element={<InboxPage key="live-agent" live />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="knowledge" element={<KnowledgePage />} />
                <Route path="flows" element={<FlowsPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="channels" element={<ChannelsPage />} />
                <Route path="pages" element={<PagesPage />} />
                <Route path="forms" element={<FormsPage key="forms" />} />
                <Route path="surveys" element={<FormsPage key="surveys" survey />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="messaging" element={<MessagingPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppRouter>
      </StoreProvider>
    </AppErrorBoundary>
  );
}
for (const [key, value] of Object.entries(brand.theme))
  document.documentElement.style.setProperty(`--${key}`, value);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
