import { appSchema } from './models';
import type { AppData, Workspace } from './models';
import { createSeed } from './seed';

export const STORAGE_KEY = 'tuslah.demo.v1';
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface DemoDataRepository {
  getSnapshot(): AppData;
  subscribe(listener: () => void): () => void;
  transact(update: (data: AppData) => void): void;
  updateWorkspace(update: (workspace: Workspace) => void): void;
  reset(): void;
}
export class LocalDemoRepository implements DemoDataRepository {
  private data: AppData;
  private listeners = new Set<() => void>();
  recovery: 'malformed' | 'unavailable' | null = null;
  constructor(private storage: StorageAdapter) {
    this.data = createSeed();
    try {
      const stored = storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = appSchema.safeParse(JSON.parse(stored));
        if (parsed.success) this.data = parsed.data;
        else this.recovery = 'malformed';
      }
    } catch {
      this.recovery = 'unavailable';
    }
  }
  getSnapshot = () => this.data;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  transact = (update: (data: AppData) => void) => {
    const next = structuredClone(this.data);
    update(next);
    appSchema.parse(next);
    // Persist before notifying: failed writes must never look saved in the UI.
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error('storageError');
    }
    this.data = next;
    this.listeners.forEach((listener) => listener());
  };
  updateWorkspace = (update: (workspace: Workspace) => void) =>
    this.transact((data) => update(data.workspaces[data.activeBusinessId]));
  reset = () =>
    this.transact((data) => {
      const language = data.language;
      Object.assign(data, createSeed());
      data.language = language;
    });
}
