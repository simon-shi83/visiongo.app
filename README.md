# VISIONGO website

React and TypeScript frontend with a Cloudflare Worker for private GitHub releases,
website authentication and engineering inquiries. Brand: **VISIONGO**. Domain:
<https://visiongo.app>.

The website is an independent application. It does not import the private source,
headers or build outputs of Studio, Runtime, Edge or Cloud. Desktop authorization
contracts are unchanged by the website reliability update.

## Development and validation

Use Node.js 24 or newer (the Worker regression suite uses `node:sqlite`).

```bash
pnpm install --frozen-lockfile
pnpm run dev
pnpm test
```

`pnpm test` checks frontend and Worker types, builds the client, prerenders and
verifies public pages, and runs the Worker tests against an in-memory SQLite
adapter with the real migrations. External providers are mocked only in tests;
production has no simulated accounts, releases or installer responses.

For a previously built tree, `pnpm run test:worker` runs only Worker regressions.

Browser smoke tests are optional and require Playwright and a local Chrome:

```bash
pnpm run preview -- --host 127.0.0.1 --port 3001
# In another terminal, with Playwright installed in your test environment:
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs pnpm run test:browser
```

`SITE_URL`, `CHROME_PATH` and `QA_DIR` override the default local URL, Chrome path
and screenshot directory. Browser tests intercept provider/contact requests and
send no real emails. They cover four viewport widths, localization, hydration,
article refresh/back, dialog keyboard interaction, download states and inquiry
retry. Do not point this smoke test at production.

## Routes and content

`shared/routes.json` is the public route registry used by the Worker, frontend,
prerenderer and SEO verifier. English URLs retain their original paths. Chinese
URLs use `/zh`, for example `/zh/downloads`. Legacy `?lang=zh` public links redirect
to their Chinese URL. Each public URL has a canonical, language alternates and a
prerendered snapshot. Article details use `/resources/:slug` and support refresh,
sharing and browser history.

Account and desktop sign-in pages are excluded from sitemap/indexing and use
`Cache-Control: no-store`. Unknown pages return 404; unknown APIs return JSON 404;
missing assets never fall back to an HTML document.

The homepage uses an actual Studio UI screenshot of an example engineering project,
not a live production feed or benchmark. Static content contains no fabricated
release versions, customer case metrics or performance guarantees. See
`public/screenshots/README.md` for screenshot provenance.

## Production configuration

`wrangler.jsonc` declares the international D1 database (`visiongo_db`) and its
plain `vars`. Every `wrangler deploy` (CI deploys on each push to `main`) replaces
the Worker's bindings and variables with that file, so a database binding or a
credential added only as a plain dashboard variable disappears on the next deploy.
Keep the database in `wrangler.jsonc` and set every credential as a secret.

Apply new migrations before publishing a Worker that needs them:

```bash
pnpm exec wrangler d1 migrations apply visiongo_db --remote
```

Required configuration by feature:

| Configuration | Purpose |
| --- | --- |
| `DB` + migrations 0001–0008 | Accounts, codes, inquiries, notification outbox, OAuth states and rate limits |
| `SESSION_SECRET` | Signed website sessions and keyed abuse-limit digests |
| `GITHUB_RELEASE_TOKEN` | Read-only token for real release metadata and binaries |
| `GITHUB_ORG`, `VISIONSTUDIO_REPO`, `VISIONRUNTIME_REPO`, `VISIONEDGE_REPO` | Optional repository overrides |
| `RESEND_API_KEY` | Verification emails and inquiry notifications |
| `CONTACT_EMAIL_TO` | Optional inquiry recipient; default `contact@visiongo.app` |
| `GOOGLE_CLIENT_ID` | Google sign-in audience validation |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth web application |
| `DESKTOP_TOKEN_PRIVATE_KEY`, `DESKTOP_TOKEN_KEY_ID`, `DESKTOP_TOKEN_ISSUER` | Existing independent desktop-token signing configuration |
| `DESKTOP_TOKEN_PUBLIC_KEYS` | Optional JSON array of earlier RSA public JWKs (with `kid`) still trusted during a key rotation |
| `DOWNLOAD_ANALYTICS_SECRET`, `DOWNLOADS_ANALYTICS` | Existing optional download analytics |

Set secrets with `pnpm exec wrangler secret put NAME`. Never put secrets in frontend
`VITE_*` variables. Configure verified Resend sending identities for
`auth@visiongo.app` and `contact@visiongo.app`. Configure GitHub's callback as
`https://visiongo.app/api/auth/github/callback`. The public client IDs returned by
`/api/auth/config` are not secrets.

`/.well-known/jwks.json` publishes the public half of the current desktop-token
key under `DESKTOP_TOKEN_KEY_ID`, then the keys of `DESKTOP_TOKEN_PUBLIC_KEYS`;
VisionCloud reads it hourly, so a rotation publishes the new key before signing
with it and keeps the old one listed until issued tokens have expired.

Release manifests (SDK `releases.json`): `GET /api/releases/{studio|edge|runtime}?platform=windows-x64&channel=stable`
answers the newest release and `min_supported` of that platform, read by VisionStudio at
start and daily; below `min_supported` it turns VisionCloud AI off and asks for the upgrade.
Rows live in the `release_manifests` table (migration 0008), separately in each edition;
platform administrators list them with `GET /api/admin/releases` and publish one with
`POST /api/admin/releases` (`product`, `platform`, `channel`, `latest`, `min_supported`,
optional https `url` and `notes_url`, `sha256`). No row means 404 and clients change nothing.

API error answers carry a code of SDK `errors.json` (`code`, `message`) beside their
existing `error` field; desktop identity errors keep `error` and `error_description`.

Downloads remain anonymous. Missing release credentials or provider failures are
reported as unavailable; an empty successful release list is shown as no releases.
Optional SHA-256 digests come from GitHub asset metadata; the site does not claim
that a package is signed or verified merely because a checksum exists.

Database errors fail authentication. Missing/failing email delivery returns an
error and never reveals a verification code. The unauthenticated GitHub demo login
endpoint is removed, and historical demo identities cannot use website sessions.
GitHub OAuth uses a browser-bound, expiring, single-use state plus PKCE. Existing
real user IDs and session formats are preserved.

## Inquiry delivery and operations

`POST /api/contact` validates and persists the inquiry before returning a reference.
The page and modal share the same form and submit product interest, locale and
source. A submission ID makes retries idempotent. No database means an explicit
503, with a direct email alternative.

Notification delivery runs in `waitUntil` and through the configured five-minute
cron. A lease and provider idempotency key prevent duplicate dispatch; failures
retry with backoff up to eight attempts. If Resend is not configured, records remain
pending and the cron sends them after configuration is restored. Receipt means
saved, not that notification has already reached the team.

Monitor queued/failed notifications without dumping customer message bodies:

```sql
SELECT notification_status, COUNT(*)
FROM contact_inquiries
GROUP BY notification_status;
```

Investigate failed deliveries before manually resetting their retry count and
`next_attempt_at`. Retain the inquiry ID so provider retries use the same key.
Expired OAuth states, rate-limit counters and verification codes are cleaned by
cron. Customer inquiries are retained for follow-up; handle deletion requests
through the documented support channel.

## Release and rollback

1. Run `pnpm test` and the local browser smoke test.
2. Bind D1, apply missing migrations and configure provider secrets/sending identities.
3. Publish the Worker and assets together through the website repository's release process.
4. Verify one real anonymous download, OAuth round trip, verification email and a
   saved inquiry with delivered notification. These provider checks require the
   production configuration and are not substituted by mocked tests.

Migration 0004 is additive. Preserve its tables if rolling back application code;
existing account/download data is not rewritten. Do not roll back to a Worker that
restores simulated sign-in, code disclosure or fake installer responses. Use a
previous hardened deployment or a forward fix for those paths.
