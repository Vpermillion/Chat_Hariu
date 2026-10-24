import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig(base, {
  testMatch: '**/pages.spec.ts',
  testIgnore: [],
  use: { baseURL: 'http://127.0.0.1:4174/Chat_Hariu/' },
  webServer: {
    command: 'npm run preview:pages',
    url: 'http://127.0.0.1:4174/Chat_Hariu/',
    reuseExistingServer: false,
  },
});
