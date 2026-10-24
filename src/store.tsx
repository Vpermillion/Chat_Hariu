import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useCallback,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { LocalDemoRepository } from './domain/repository';
import { errorKeys, translate } from './i18n';
import type { AppData, Workspace } from './domain/models';

type Notice = { text: string; error: boolean; id: number } | null;
interface Context {
  data: AppData;
  w: Workspace;
  repo: LocalDemoRepository;
  t: (key: string) => string;
  notice: Notice;
  notify: (key: string, error?: boolean) => void;
  run: (action: () => void, success?: string) => boolean;
}
const StoreContext = createContext<Context | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [repo] = useState(
    () =>
      new LocalDemoRepository({
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
      }),
  );
  const data = useSyncExternalStore(repo.subscribe, repo.getSnapshot);
  const [notice, setNotice] = useState<Notice>(null);
  const t = useCallback((key: string) => translate(data.language, key), [data.language]);
  const notify = useCallback(
    (key: string, error = false) =>
      setNotice({ text: translate(data.language, errorKeys[key] || key), error, id: Date.now() }),
    [data.language],
  );
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    document.documentElement.lang = data.language;
  }, [data.language]);
  const run = (action: () => void, success = 'Saved') => {
    try {
      action();
      if (success) notify(success);
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : 'required', true);
      return false;
    }
  };
  return (
    <StoreContext.Provider
      value={{ data, repo, w: data.workspaces[data.activeBusinessId], t, notice, notify, run }}
    >
      {children}
      {notice && (
        <div
          className={`toast ${notice.error ? 'toast-error' : ''}`}
          role={notice.error ? 'alert' : 'status'}
          key={notice.id}
        >
          <span>{notice.error ? '!' : '✓'}</span>
          {notice.text}
          <button aria-label={t('Close')} onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('StoreProvider is required');
  return context;
}
