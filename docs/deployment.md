# Cloudflare deployment

The current application is a browser-only React/TypeScript/Vite SPA. It does not require a Worker API or database to demonstrate its local workflows.

## Build and inspect

```sh
npm ci
npm run build
npm run preview
```

The output directory is `dist/`. Direct navigation to `/app/inbox` and other client routes needs an SPA fallback to `index.html`. The included `wrangler.jsonc` configures Cloudflare Workers static assets with `not_found_handling: single-page-application`.

```sh
npx wrangler deploy --dry-run   # inspect only; does not publish
```

Publishing requires the owner's Cloudflare account and explicit deployment authorization. Once authorized, authenticate with the normal Cloudflare tooling and run `npx wrangler deploy`. Choose a real account, hostname and final brand before production. This repository does not claim that deployment has happened.

Cloudflare Pages is an alternative: build command `npm run build`, output directory `dist`, Node.js 24, SPA fallback enabled. There are no necessary public environment values. `.env.example` documents placeholder names for a future API; setting them alone does not enable real integrations.

## Server work still required

1. Implement an authenticated Worker API following `src/integrations/contracts.ts`. Enforce business membership and roles on every server operation; the browser business switch is only demo isolation.
2. Add D1 migrations and repositories for the typed entities. Tenant keys, server validation, concurrency, backups and retention belong on the server. The demo's order stock transitions are synchronous browser transactions, not a production inventory system.
3. Implement Meta OAuth with server-held app/Page credentials, webhook signature verification, idempotent delivery, token expiration, approved permissions and App Review. Only verified server responses may set a real channel to Connected.
4. Implement a server AI adapter with business-scoped retrieval, unknown-answer handling, safety/quality evaluation and appropriate consent/retention. Never embed an AI provider key in frontend code. Text/Markdown import in this demo is local text storage; PDF extraction and model training are not connected.
5. Implement queues and messaging consent/policy enforcement before enabling sends. Real sends are unavailable in the demo, including broadcasts and post comments.
6. Add payment-provider invoices and independently verified payment webhooks. “Simulated paid” is explicitly a demonstration; it is never proof of real payment or revenue.
7. Replace draft legal content, pricing, contact details, brand and entitlements with approved business configuration. Test authentication, account recovery, tenant isolation, accessibility and production observability before launch.

No credentials should be committed. Server secrets belong in Cloudflare's secure configuration, not `.env.example`, `VITE_*` values, localStorage, logs or screenshots.
