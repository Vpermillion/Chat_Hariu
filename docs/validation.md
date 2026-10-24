# Validation evidence

Validated in the managed Linux cloud environment on **24 October 2026**, using Node.js 24 and system Chromium. These are local results; no remote CI run or live deployment is claimed.

| Check                                                            | Result                        |
| ---------------------------------------------------------------- | ----------------------------- |
| Frozen installation (`npm ci`)                                   | Passed                        |
| TypeScript and production build (`npm run build`)                | Passed                        |
| ESLint (`npm run lint`)                                          | Passed                        |
| Prettier (`npm run format:check`)                                | Passed                        |
| Data/workflow tests (`npm test`)                                 | 12 passed                     |
| Chromium acceptance suite (`npm run test:e2e`)                   | 15 passed                     |
| Flow and responsive checks after final mobile-control adjustment | 4 passed                      |
| Cloudflare static assets (`npm run deploy:check`)                | Dry run passed; not published |

The browser suite covers the public demo entry, bot creation/rename/archive/restore and refresh, FAQ/product updates used by test chat, unknown-question fallback, inbox drafts/replies/notes, persistent human takeover and explicit resume, unread filtering, conversation-to-order totals/contact history/overview counts, flow validation and draft/published separation, form/survey submissions, booking conflict rejection/cancellation, workspace isolation, secondary module saves, all dashboard routes and page errors.

Responsive checks await actual page content at **1440, 1024 and 390 px**, check document overflow, open/close dialogs, verify the flow Add block control remains accessible, and exercise the mobile navigation drawer, inbox thread/back action and customer details. These are representative functional checks, not a claim of exhaustive accessibility conformance or cross-browser certification.

## Screenshots

All images show fictional local demo data and the default Mongolian locale.

| Screen                               | Capture                                                |
| ------------------------------------ | ------------------------------------------------------ |
| Public website · 1440 px             | [Desktop website](screenshots/website-desktop.png)     |
| Overview · 1440 px                   | [Desktop dashboard](screenshots/dashboard-desktop.png) |
| Inbox and customer details · 1440 px | [Desktop inbox](screenshots/inbox-desktop.png)         |
| Flow editor · 1024 px                | [Tablet flow editor](screenshots/flow-tablet.png)      |
| Inbox · 390 px                       | [Mobile inbox](screenshots/inbox-mobile.png)           |
| Public website · 390 px              | [Mobile website](screenshots/website-mobile.png)       |

Real Meta connections, AI providers, authentication, tenant authorization, payment verification, D1, PDF extraction and live deployment remain unconnected. See [deployment.md](deployment.md).
