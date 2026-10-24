# Deployment

The current application is a browser-only React/TypeScript/Vite SPA. It does not require a Worker API or database to demonstrate its local workflows.

## GitHub Pages · free github.io address

The project site address is `https://vpermillion.github.io/Chat_Hariu/` after GitHub Pages is enabled. Its dashboard link is `https://vpermillion.github.io/Chat_Hariu/#/app`. This is a public demo with browser-local records; real integrations remain unconnected.

The Pages build uses the `/Chat_Hariu/` asset base and hash routing, so dashboard links and refreshes work on static hosting. The normal development and Cloudflare builds retain their existing `/app` browser routes.

```sh
npm ci
npm run build:pages
npm run test:pages
npm run publish:pages
```

`publish:pages` uploads only the built `dist/` files and `.nojekyll` to a separate `gh-pages` branch using existing Git authentication. It does not change the source checkout, staging area or repository visibility. Existing deployment history is preserved with a normal fast-forward push. No GitHub token is stored in the repository.

One-time repository setup: open **Settings → Pages**, choose **Deploy from a branch**, select **gh-pages** and **/ (root)**, then **Save**. GitHub will build and publish that branch. Pushes alone do not prove Pages is enabled or that a deployment has succeeded; verify the site after GitHub finishes the Pages build.

Future changes are published by repeating the build/test/publish commands from the source branch. CI validates both hosting modes but does not publish automatically. Browser checks run the actual production Pages build under its repository subpath, covering assets, marketing links, demo navigation, refresh/persistence, direct mobile routes and flow controls.

## Cloudflare

### Build and inspect

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
