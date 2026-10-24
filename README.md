# Туслах · Mongolian business assistant

An interactive SaaS **frontend demonstration** for Mongolian shops and service businesses. The working brand name is **Туслах**. The product brings conversations, business knowledge, products, orders and local automation into a single workspace.

The dashboard screenshots supplied with the brief informed the bot picker, grouped navigation, general/main-menu/Page-link settings and entitlement details. All interface components, product illustrations, copy and sample records are original. No competitor logos, screenshots, customer claims or private systems are included.

## Start development

Requires Node.js **22.13+** (Node.js 24 recommended) and npm. No credentials or external services are needed.

```sh
npm ci
npm run dev
```

Open the Vite development server in your local browser. The public site is at `/`; **Демо үзэх / Try the demo** opens `/app`. `/pricing`, `/login` and `/register` also work. Demo login never asks for a password or creates an account.

In the managed cloud environment, npm's default home cache is read-only. Use:

```sh
cd /workspace/Chat_Hariu
npm ci --cache /workspace/.cache/npm
npm run dev -- --port 5173
```

Each cloud task already has an isolated checkout. Use the existing `/workspace/Chat_Hariu` checkout; do not create a Git worktree unless explicitly requested.

## What you can demonstrate

- **Marketing:** original Mongolian landing page, MN/EN switching, interactive shared-inbox and industry examples, pricing previews, FAQ and draft legal information.
- **Business isolation:** switch between Нүүдэл Store and Гоо студио. Each has separate contacts, conversations, bots, knowledge, products, orders and content. Workspace selection persists across refreshes.
- **Bots:** create, search, rename, duplicate, archive and restore. Select a bot in the sidebar to configure its settings and flow.
- **Inbox / live agent:** channel/status/search filters, read state, persisted reply drafts, local staff replies, saved replies, product cards, private notes, assignment, resolve/reopen, customer details and related orders. “Take over” pauses simulated automation until explicitly resumed. Use **Local test** to simulate an incoming customer message.
- **Knowledge:** local CRUD for business information, FAQs and text/Markdown documents, keyword search, enable/disable and explicit draft/publish. Saving an edit creates a draft; publish it before expecting test chat to use it. Matching supports Cyrillic and Latin keywords (`Хүргэлт`, `hurgelt`, `tsamts`). Current products are consulted directly. Unknown facts trigger clarification/handoff.
- **Commerce:** product editing with size/color/SKU/stock validation, reversible archives and CSV import with preview/errors. Create order drafts from a conversation; totals, customer history and overview counts share the same records. Order item prices are snapshots. Confirming an order reserves stock; cancellation releases it. Delivery information, assignment and fulfillment are editable. Payments can only be **explicitly simulated**.
- **Flows:** Start, Message, Question, Condition, AI fallback and Human handoff blocks; keyboard-accessible selection, properties and connection selectors; duplication/removal; saved drafts, validation and separate published versions. Preview runs the published flow and waits for question responses. Preview is bounded to 40 steps.
- **Settings:** active/automated/typing preferences, welcome text, initial questions, fallback, persona and URL/block menu entries. Business information and notification preferences can be saved. Team roles are examples.
- **Content:** static-page drafts/publication and safe text preview; form builder with required/email validation and saved submissions; text/single-choice survey builder and saved responses.
- **Other modules:** staff booking with 30-minute overlap prevention and cancellation in Ulaanbaatar time; saved keyword post rules and local tests; audience/tag messaging drafts; date-filtered analytics from actual demo records; plan/usage previews with explanatory upgrade dialogs.

All 19 dashboard routes have meaningful screens. On mobile the sidebar becomes a drawer and the inbox switches between list/thread/customer-detail views. Tables scroll within their own containers.

## Validation

```sh
npm run build       # TypeScript + production Vite build
npm run typecheck
npm run lint
npm test            # persistent data and workflow tests
npm run test:e2e    # Chromium acceptance and responsive tests
```

The browser tests use `/usr/bin/chromium` when available. Otherwise install a Playwright browser using `npx playwright install --with-deps chromium`. To select another system executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path.

Tests exercise public demo entry, bot persistence/recovery, FAQ and product simulation, human takeover, order totals/history/counts, flow validation/publication/preview, form/survey responses, booking conflicts/cancellation, business isolation, secondary module saves, route errors and responsive behavior at **1440, 1024 and 390 px**. CI repeats build, lint, unit tests and browser tests. Reports go to ignored `test-results/` and `playwright-report/` directories.

## Configuration and architecture

- `src/config.ts`: brand, logo, contact fields, theme colors, plan contents, entitlements, staff and service examples. Contact values and prices are intentionally unconfigured; “Get a quote” does not pretend to send a request.
- `src/i18n.ts`: central Mongolian dictionary with English keys as the English dictionary. Fixture records are fictional Mongolian content and retain their original language when the UI locale changes.
- `src/domain/models.ts`: runtime-validated typed domain models.
- `src/domain/repository.ts`: repository interface and versioned browser storage (`tuslah.demo.v1`). Writes are atomic from the UI's perspective; failed/quota-exceeded writes show errors. Malformed/unsupported records recover to sample data with a notice.
- `src/domain/services.ts`: coherent order/stock operations, knowledge/product matching, booking validation, CSV parsing and derived metrics.
- `src/domain/flow.ts`: bounded deterministic published-flow preview.
- `src/integrations/contracts.ts`: separate future Worker API, D1, Meta, AI and payments contracts. No production adapter is connected.
- `src/pages/`: marketing, dashboard and module screens. Shared components in `src/components/` include message bubbles used on both public and dashboard screens.

Use **Account → Reset demo** to replace changes in **both** demo businesses with sample data. Demo records stay in this browser and are not shared between devices or browsers. There is no server database, authentication or production tenant access control. Do not enter real customer information.

## Deployment and next phase

See [Cloudflare deployment](docs/deployment.md) for a static deployment and the server integration checklist. `.env.example` contains only public placeholder names. Keep credentials on a future server; never put Meta tokens, app secrets or AI keys in `VITE_*`, browser bundles or localStorage.

Real Meta connections/delivery/OAuth, webhook validation, App Review, authentication, authorization, D1 persistence, AI generation, PDF extraction, queues, bulk-send policy checks, payment processing and payment verification **are not implemented**. The application never represents demo connections, simulated AI replies, local messages or payment transitions as real integrations. No deployment or external approval is implied.
