# VISIONGO Official Web Platform

> **Industrial Vision Intelligence**  
> *Build, run, and improve industrial vision systems with AI.*  
> Production Domain: [https://visiongo.app](https://visiongo.app)

---

## 1. System Architecture Overview

The VISIONGO web platform is an enterprise-grade, product-first technical website deployed globally on **Cloudflare Workers**. It serves as the primary portal for industrial automation engineers, vision system integrators, and enterprise manufacturing teams.

```
                      +---------------------------------------+
                      |               Browser                 |
                      |   (visiongo.app / www.visiongo.app)   |
                      +---------------------------------------+
                                          |
                      +---------------------------------------+
                      |       Cloudflare Global Edge          |
                      |   (Worker Assets + Dynamic APIs)      |
                      +---------------------------------------+
                           /              |              \
                          /               |               \
   +-----------------------+   +-------------------+   +--------------------+
   |   Static Assets / UI  |   | Edge APIs         |   | /api/download      |
   | (React 19 + Tailwind) |   | /api/releases     |   | (Secure Proxy)     |
   | Prerendered Snapshots |   | /api/auth/*       |   +--------------------+
   +-----------------------+   | /api/contact      |              |
                               +-------------------+              | Authenticated
                                   /           \                  | Stream
                    Non-blocking  /             \ D1 Queries      v
                                 v               v             +--------------------+
                     +-------------------+  +---------------+  | Private GitHub     |
                     | Workers Analytics |  | Cloudflare D1 |  | Releases REST API  |
                     | Engine Dataset    |  | Database (DB) |  | (PAT read-only)    |
                     | visiongo_downloads|  | Users/History |  +--------------------+
                     +-------------------+  +---------------+
```

### Core Architectural Guarantees
1. **Zero Client Token Exposure**: Private GitHub tokens, OAuth secrets, and analytics secrets NEVER reach browser JavaScript.
2. **Strict Direct Route & API Isolation**:
   - Important public pages (`/`, `/downloads`, `/contact`, `/privacy`, `/terms`, etc.) are directly accessible with instant HTTP 200 without unnecessary redirects or requiring homepage navigation.
   - Non-existent `/api/*` endpoints strictly return `HTTP 404 JSON`, never falling back to the SPA HTML document.
   - Non-existent `/assets/*` files strictly return `HTTP 404 Plain Text`, preventing script syntax errors.
3. **Anonymous Downloads Preserved**: Software downloads remain 100% accessible anonymously without requiring Google authentication.
4. **Air-Gapped Industrial Guarantee**: Communicates clearly that VISIONGO core runtimes run 100% offline in air-gapped factory environments.
5. **Data Minimization & Privacy**:
   - Zero raw IP addresses stored in analytics (uses server-side HMAC-SHA256 pseudonymous hashing).
   - Zero Google password handling (uses official Google Identity Services with minimal scopes: `openid`, `email`, `profile`).

---

## 2. Product Suite Hierarchy

| Product | Role | Downloadable? | Primary Platforms |
| :--- | :--- | :--- | :--- |
| **VisionStudio** | Engineering Workspace | Yes (`/downloads`) | Windows x64, Ubuntu x86_64 |
| **VisionRuntime** | Production Runtime | Yes (`/downloads`) | Ubuntu Linux (x86_64, aarch64), Windows Server |
| **VisionEdge** | On-site Intelligence Gateway | Yes (`/downloads`) | Industrial IPC Linux (x86_64, aarch64) |
| **VisionCloud** | Cloud Intelligence (Optional) | **No** (Cloud SaaS) | Web / API Only |

*Important Rule*: **VisionAgent** is the internal architectural framework name; the primary commercial brand is always **VISIONGO**.

---

## 3. Technology Stack

- **Frontend Core**: React 19 + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom industrial tokens (`Plus Jakarta Sans` + `JetBrains Mono`)
- **Authentication**: Official Google Identity Services (GIS) / OpenID Connect + signed HttpOnly sessions
- **Storage**: Cloudflare D1 SQL database (`visiongo_db`) for users and download history
- **Analytics**: Cloudflare Workers Analytics Engine (`visiongo_downloads`)
- **Routing**: Client-side history routing with static route prerendering for SEO
- **Markdown**: Custom injection-safe AST parser (no unsafe `dangerouslySetInnerHTML`)
- **Edge Deployment**: Cloudflare Workers with Static Assets & Node.js compatibility
- **CI/CD**: GitHub Actions deploying to `simon-shi83/website` on `main` branch

---

## 4. Environment & Secrets Configuration

A configuration template is provided in [`.env.example`](.env.example).

### Configuration Matrix

| Variable / Secret | Type | Location | Description |
| :--- | :--- | :--- | :--- |
| `GITHUB_RELEASE_TOKEN` | Secret | Cloudflare Secret | GitHub Personal Access Token (PAT) with read-only access to private repositories. |
| `GITHUB_ORG` | Variable | Worker Env | GitHub organization or owner account (default: `simon-shi83`). |
| `VISIONSTUDIO_REPO` | Variable | Worker Env | Private repository name for VisionStudio (default: `VisionStudio`). |
| `VISIONRUNTIME_REPO` | Variable | Worker Env | Private repository name for VisionRuntime (default: `VisionRuntime`). |
| `VISIONEDGE_REPO` | Variable | Worker Env | Private repository name for VisionEdge (default: `VisionEdge`). |
| `DOWNLOAD_ANALYTICS_SECRET` | Secret | Cloudflare Secret | Cryptographic salt used for pseudonymous HMAC visitor deduplication. |
| `GOOGLE_CLIENT_ID` | Variable/Secret | Cloudflare Secret | Google OAuth 2.0 Web Client ID from Google Cloud Console. |
| `SESSION_SECRET` | Secret | Cloudflare Secret | Cryptographic key used to sign `vg_session` HttpOnly session cookies. |
| `DESKTOP_TOKEN_PRIVATE_KEY` | Secret | Cloudflare Secret | PKCS#8 RSA private key used only for short-lived VisionStudio tokens. |
| `DESKTOP_TOKEN_KEY_ID` | Variable | Worker Env | Signing key identifier; must match VisionCloud's configured key ID. |
| `DESKTOP_TOKEN_ISSUER` | Variable | Worker Env | Token issuer, normally `https://visiongo.app`. |
| `DOWNLOADS_CACHE_TTL_SEC` | Variable | Worker Env | In-worker cache TTL for release metadata (default: `600` seconds). |

### Configuring Secrets in Cloudflare Workers

```bash
# 1. GitHub private releases token
npx wrangler secret put GITHUB_RELEASE_TOKEN

# 2. Download analytics HMAC salt
npx wrangler secret put DOWNLOAD_ANALYTICS_SECRET

# 3. Session cookie signing secret
npx wrangler secret put SESSION_SECRET

# 4. Optional: Google OAuth Web Client ID
npx wrangler secret put GOOGLE_CLIENT_ID

# 5. Independent PKCS#8 RSA key for VisionStudio desktop tokens
npx wrangler secret put DESKTOP_TOKEN_PRIVATE_KEY
```

---

## 5. Cloudflare D1 Database & Migrations (Phase 3)

Cloudflare D1 provides lightweight, serverless SQL storage for user accounts and personal download history.

### 1. Database Creation
```bash
npx wrangler d1 create visiongo_db
```
The command outputs your `database_id`. Add it to `wrangler.jsonc`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "visiongo_db",
    "database_id": "<YOUR_D1_DATABASE_UUID>"
  }
]
```

### 2. Apply Migrations
Version-controlled migrations live in [`migrations/`](migrations/). Apply them in numeric order.

```bash
# Apply migrations locally for testing:
npx wrangler d1 execute visiongo_db --local --file=migrations/0001_create_users_and_downloads.sql
npx wrangler d1 execute visiongo_db --local --file=migrations/0002_add_cloud_identity.sql

# Apply migrations to production Cloudflare D1:
npx wrangler d1 execute visiongo_db --remote --file=migrations/0001_create_users_and_downloads.sql
npx wrangler d1 execute visiongo_db --remote --file=migrations/0002_add_cloud_identity.sql
```

### 3. Database Schema
- **`users`**:
  - `id` (TEXT PRIMARY KEY, internal UUID like `vg_usr_xxxxx`)
  - `tenant_id` (TEXT, indexed stable Cloud tenant scope; organization members may share it)
  - `role` (`member`, `org_admin`, or `super_admin`)
  - `google_sub` (TEXT UNIQUE NOT NULL, stable Google subject identifier)
  - `email` (TEXT NOT NULL)
  - `display_name` (TEXT)
  - `avatar_url` (TEXT)
  - `created_at` (TEXT)
  - `last_login_at` (TEXT)
- **`user_download_history`**:
  - `id` (TEXT PRIMARY KEY)
  - `user_id` (TEXT NOT NULL, foreign key to `users.id`)
  - `product` (TEXT NOT NULL)
  - `version` (TEXT NOT NULL)
  - `asset_name` (TEXT NOT NULL)
  - `downloaded_at` (TEXT NOT NULL)

---

## 6. Server-Side Edge API Architecture

### 1. `GET /api/releases`
Returns normalized release information for all three downloadable products (`visionstudio`, `visionruntime`, `visionedge`).
- Cached in Worker memory for 10 minutes (`s-maxage=600`).
- Supports `?includePrereleases=true`.

### 2. `GET /api/download/:product/:assetId`
Secure proxy streaming binary release assets from private repositories to clients.
- Whitelists only certified VISIONGO products.
- Checks for authenticated `vg_session` cookie; if present, logs download in D1 `user_download_history`.
- Streams asset with sanitized `Content-Disposition: attachment; filename="..."` headers.
- Dispatches privacy-preserving event to Workers Analytics Engine.

### 3. `POST /api/auth/google`
Authenticates a user via official Google Identity Services credential.
- Server-side verification with Google's tokeninfo API.
- Upserts user record in Cloudflare D1.
- Sets signed `vg_session` cookie: `HttpOnly; Secure; SameSite=Lax; Max-Age=30 days`.

### 4. `GET /api/auth/me`
Returns current authenticated user profile (`{ user: { id, email, displayName, avatarUrl, createdAt } }`) or `{ user: null }`.

### 5. `POST /api/auth/logout`
Terminates the session by clearing `vg_session` cookie.

### 6. `POST /api/auth/desktop-token`
Validates the HttpOnly website session and returns a ten-minute RS256 token scoped to the user's tenant. VisionStudio passes this opaque token through VisionEdge to VisionCloud.

### 7. `GET /api/user/downloads`
Returns the authenticated user's software download history from D1.

### 8. `POST /api/contact`
Enterprise pilot and architecture consultation submission handler with bot honeypot protection.

### 9. `GET /api/health`
Edge status, CF data center code, and D1/Analytics readiness probe.

---

## 7. Privacy-Conscious Download Analytics (Workers Analytics Engine)

### Enabling Analytics Engine:
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Analytics Engine**.
2. Click **Enable Analytics Engine**.
3. In `wrangler.jsonc`, uncomment the `analytics_engine_datasets` block:
```jsonc
"analytics_engine_datasets": [
  {
    "binding": "DOWNLOADS_ANALYTICS",
    "dataset": "visiongo_downloads"
  }
]
```

### Example SQL Queries for Analytics Engine

```sql
-- 1. Total downloads by product
SELECT blob1 AS product, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product
ORDER BY total_downloads DESC;

-- 2. Downloads by country
SELECT blob6 AS country, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY country
ORDER BY total_downloads DESC
LIMIT 10;

-- 3. Downloads by region
SELECT blob6 AS country, blob7 AS region, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY country, region
ORDER BY total_downloads DESC;

-- 4. VisionStudio downloads by country
SELECT blob6 AS country, COUNT() AS downloads
FROM visiongo_downloads
WHERE blob1 = 'visionstudio' AND blob8 = 'success'
GROUP BY country
ORDER BY downloads DESC;

-- 5. VisionRuntime downloads by country
SELECT blob6 AS country, COUNT() AS downloads
FROM visiongo_downloads
WHERE blob1 = 'visionruntime' AND blob8 = 'success'
GROUP BY country
ORDER BY downloads DESC;

-- 6. VisionEdge downloads by country
SELECT blob6 AS country, COUNT() AS downloads
FROM visiongo_downloads
WHERE blob1 = 'visionedge' AND blob8 = 'success'
GROUP BY country
ORDER BY downloads DESC;

-- 7. Downloads by platform & architecture
SELECT blob4 AS platform, blob5 AS arch, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY platform, arch
ORDER BY total_downloads DESC;

-- 8. Downloads during last 30 days
SELECT toStartOfDay(timestamp) AS day, blob1 AS product, COUNT() AS daily_downloads
FROM visiongo_downloads
WHERE timestamp >= NOW() - INTERVAL '30' DAY AND blob8 = 'success'
GROUP BY day, product
ORDER BY day ASC;

-- 9. Approximate unique anonymous download sources
SELECT blob1 AS product, COUNT(DISTINCT blob9) AS approximate_unique_clients
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product;
```

---

## 8. Google Search Console & SEO Configuration

All 12 public routes have dedicated prerendered HTML snapshots in `dist/` with full OpenGraph, Twitter, canonical, and JSON-LD structured data.

### Step-by-Step Search Console Verification:
1. Open [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property and enter `visiongo.app`.
3. Copy the TXT verification record: `google-site-verification=XXXXXXXXXXXXXXXXXXXX`.
4. In [Cloudflare Dashboard](https://dash.cloudflare.com/) > **DNS** > **Records** for `visiongo.app`:
   - Type: `TXT`
   - Name: `@`
   - Content: `google-site-verification=XXXXXXXXXXXXXXXXXXXX`
   - TTL: `Auto`
5. Click **Verify** in Google Search Console.
6. Under **Sitemaps**, submit: `https://visiongo.app/sitemap.xml`.
7. Request indexing for major landing pages (`/`, `/downloads`, `/products/visionstudio`, `/products/visionruntime`, `/products/visionedge`, `/contact`).

---

## 9. Manual Setup Checklist for Repository Owner

The following actions must be executed manually by the project maintainer:

- [ ] **Cloudflare D1 Database**:
  - Run `npx wrangler d1 create visiongo_db`
  - Paste the generated `database_id` into `wrangler.jsonc`
  - Run `npx wrangler d1 execute visiongo_db --remote --file=migrations/0001_create_users_and_downloads.sql`
  - Run `npx wrangler d1 execute visiongo_db --remote --file=migrations/0002_add_cloud_identity.sql`
- [ ] **Cloudflare Analytics Engine**:
  - Visit `https://dash.cloudflare.com/<ACCOUNT_ID>/workers/analytics-engine` and click **Enable Analytics Engine**
  - Uncomment the `analytics_engine_datasets` block in `wrangler.jsonc`
- [ ] **Cloudflare Worker Secrets**:
  - Run `npx wrangler secret put GITHUB_RELEASE_TOKEN` (Fine-grained PAT with read access to private repos)
  - Run `npx wrangler secret put DOWNLOAD_ANALYTICS_SECRET` (HMAC salt for anonymous download deduplication)
  - Run `npx wrangler secret put SESSION_SECRET` (Cryptographic key for signing session cookies)
  - Run `npx wrangler secret put DESKTOP_TOKEN_PRIVATE_KEY` (Independent PKCS#8 RSA signing key for desktop tokens)
  - Run `npx wrangler secret put GOOGLE_CLIENT_ID` (Web Client ID from Google Cloud Console)
- [ ] **Google Cloud Console (OAuth & Sign-In)**:
  - Create OAuth 2.0 Web Application client
  - Add Authorized JavaScript Origins: `https://visiongo.app`, `https://www.visiongo.app`, `http://localhost:3000`
- [ ] **Google Search Console**:
  - Add DNS TXT record in Cloudflare for domain verification
  - Submit `https://visiongo.app/sitemap.xml`

---

## 10. Local Development & Testing

```bash
# Install dependencies
pnpm install

# TypeScript typecheck
pnpm run typecheck

# Production build and prerender static routes
pnpm run build

# Start local Vite development server
pnpm run dev

# Preview Cloudflare Worker environment locally
npx wrangler dev
```

---

## 11. Contacts & Channels

- **Target Domain**: [https://visiongo.app](https://visiongo.app)
- **General Inquiries**: [contact@visiongo.app](mailto:contact@visiongo.app)
- **Enterprise & OEM Licensing**: [sales@visiongo.app](mailto:sales@visiongo.app)
- **Technical Support & Integrators**: [support@visiongo.app](mailto:support@visiongo.app)
- **GitHub Repository**: [simon-shi83/website](https://github.com/simon-shi83/website)
