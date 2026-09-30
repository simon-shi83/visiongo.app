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
   |   Static Assets / UI  |   | /api/releases     |   | /api/download      |
   | (React 19 + Tailwind) |   | /api/contact      |   | (Secure Proxy)     |
   +-----------------------+   +-------------------+   +--------------------+
                                          |                       |
                                          | Non-blocking          | Authenticated Stream
                                          v                       v
                              +-----------------------+   +--------------------+
                              | Workers Analytics     |   | Private GitHub     |
                              | Engine Dataset        |   | Releases REST API  |
                              | (visiongo_downloads)  |   | (PAT read-only)    |
                              +-----------------------+   +--------------------+
```

### Core Architectural Guarantees
1. **Zero Client Token Exposure**: Private GitHub tokens and analytics secrets NEVER reach browser JavaScript.
2. **Strict Repository Whitelist**: The download proxy strictly validates product names (`visionstudio`, `visionruntime`, `visionedge`) and numeric asset IDs, rejecting arbitrary URL proxying.
3. **Graceful Fallback**: If GitHub APIs or network uplinks are temporarily unavailable, the Downloads UI renders high-fidelity evaluation builds rather than breaking.
4. **Air-Gapped Industrial Guarantee**: Communicates clearly that VISIONGO core runtimes run 100% offline in air-gapped factory environments.

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
- **Routing**: Client-side history routing with static route prerendering for SEO
- **Markdown**: Injection-safe custom AST parser (no unsafe `dangerouslySetInnerHTML`)
- **Serverless Runtime**: Cloudflare Workers with Workers Assets & Analytics Engine
- **CI/CD**: GitHub Actions deploying to `simon-shi83/website` on `main` branch

---

## 4. Environment & Secrets Configuration

Create a `.dev.vars` file for local development (or use `.env.example` as a template):

```bash
cp .env.example .dev.vars
```

### Required Configuration Matrix

| Variable / Secret | Type | Location | Description |
| :--- | :--- | :--- | :--- |
| `GITHUB_RELEASE_TOKEN` | Secret | Cloudflare Secret | GitHub Personal Access Token (PAT) with read-only access to private repositories. |
| `GITHUB_ORG` | Variable | Worker Env | GitHub organization or owner account (default: `simon-shi83`). |
| `VISIONSTUDIO_REPO` | Variable | Worker Env | Private repository name for VisionStudio (default: `VisionStudio`). |
| `VISIONRUNTIME_REPO` | Variable | Worker Env | Private repository name for VisionRuntime (default: `VisionRuntime`). |
| `VISIONEDGE_REPO` | Variable | Worker Env | Private repository name for VisionEdge (default: `VisionEdge`). |
| `DOWNLOAD_ANALYTICS_SECRET` | Secret | Cloudflare Secret | Cryptographic salt used for pseudonymous HMAC visitor deduplication. |
| `DOWNLOADS_CACHE_TTL_SEC` | Variable | Worker Env | In-worker cache TTL for release metadata (default: `600` seconds). |

### Configuring Secrets in Cloudflare Workers

#### Via Wrangler CLI:
```bash
# 1. Set the GitHub release token
npx wrangler secret put GITHUB_RELEASE_TOKEN
# (Paste your token when prompted)

# 2. Set the download analytics HMAC salt
npx wrangler secret put DOWNLOAD_ANALYTICS_SECRET
# (Paste a secure random 32+ character string)
```

#### Via Cloudflare Dashboard:
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > `visiongo-website`.
2. Go to **Settings** > **Variables and Secrets**.
3. Under **Secrets**, click **Add** and provide `GITHUB_RELEASE_TOKEN` and `DOWNLOAD_ANALYTICS_SECRET`.
4. Click **Deploy**.

### GitHub Token Permissions Guide
Create a **Fine-grained personal access token** at [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens?type=beta):
- **Resource Owner**: `simon-shi83` (or your organization)
- **Repository Access**: Only select the required private repositories:
  - `VisionStudio`
  - `VisionRuntime`
  - `VisionEdge`
- **Permissions**:
  - **Contents**: `Read-only` (allows reading releases and downloading release asset binaries)
  - **Metadata**: `Read-only` (mandatory for repository resolution)

---

## 5. Server-Side Edge API Architecture

### 1. `GET /api/releases`
Returns normalized release information for all three downloadable products.
- **Query Params**: `includePrereleases=true|false` (default: `false`)
- **Cache**: Cached in Cloudflare Worker memory for 10 minutes (`s-maxage=600`).
- **Response Format**:
```json
{
  "success": true,
  "releases": {
    "visionstudio": [
      {
        "product": "visionstudio",
        "version": "v1.0.0",
        "name": "VisionStudio 1.0.0 — General Availability",
        "publishedAt": "2026-09-28T08:00:00Z",
        "description": "Markdown release notes...",
        "prerelease": false,
        "assets": [
          {
            "id": "101",
            "name": "VisionStudio-Setup-1.0.0-x64.exe",
            "size": 142606336,
            "contentType": "application/vnd.microsoft.portable-executable",
            "platform": "windows",
            "arch": "x64",
            "downloadUrl": "/api/download/visionstudio/101"
          }
        ]
      }
    ],
    "visionruntime": [...],
    "visionedge": [...]
  },
  "updatedAt": "2026-10-01T06:00:00Z"
}
```

### 2. `GET /api/download/:product/:assetId`
Secure proxy streaming binary release assets from private repositories to clients.
- **Validation**:
  - `product` must be one of `visionstudio`, `visionruntime`, `visionedge`.
  - `assetId` must be strictly numeric.
- **Headers**:
  - `Content-Disposition: attachment; filename="..."`
  - `Content-Type`: binary MIME type
  - `Cache-Control: private, no-cache, no-store, must-revalidate`
- **Privacy Analytics**: Dispatches a non-blocking download event to Cloudflare Workers Analytics Engine.

### 3. `POST /api/contact`
Enterprise pilot and architecture consultation submission handler.
- **Fields**: `name`, `email`, `company`, `country`, `productInterest`, `projectScope`.
- **Bot Mitigation**: Includes an invisible honeypot field (`websiteUrl`). If filled, requests are dropped silently.
- **Response**: `{ "success": true, "referenceId": "VG-XXXXXX" }`.

### 4. `GET /api/health`
Health check endpoint reporting edge node data center (`request.cf.colo`) and platform status.

---

## 6. Privacy-Conscious Download Analytics

Download events are recorded using **Cloudflare Workers Analytics Engine**, offering serverless analytics without cookies, tracking scripts, or invasive browser fingerprinting.

### Privacy Guarantees
- **No Raw IP Storage**: Visitor IP addresses are NEVER stored in Analytics Engine or exposed in APIs.
- **Pseudonymous Deduplication**: An HMAC-SHA256 hash is computed using `DOWNLOAD_ANALYTICS_SECRET` and the client IP. This allows aggregate counting of unique downloading networks without identifying users.
- **Geolocation**: Derived purely from Cloudflare edge routing headers (`request.cf.country`, `request.cf.region`).
- **Non-Blocking**: Analytics recording is wrapped in `ctx.waitUntil(...)`. An analytics failure will **never** cause a download to fail or stall.

### Wrangler Binding (`wrangler.jsonc`)
```jsonc
"analytics_engine_datasets": [
  {
    "binding": "DOWNLOADS_ANALYTICS",
    "dataset": "visiongo_downloads"
  }
]
```

### Dataset Schema
- **`blob1`**: `product` (`visionstudio` | `visionruntime` | `visionedge`)
- **`blob2`**: `version` (e.g. `v1.0.0`)
- **`blob3`**: `asset_name` (e.g. `visionruntime-1.0.0-linux-x86_64.tar.gz`)
- **`blob4`**: `platform` (`windows` | `linux` | `macos` | `generic`)
- **`blob5`**: `arch` (`x64` | `arm64` | `universal`)
- **`blob6`**: `country` (ISO country code, e.g. `US`, `DE`, `CN`)
- **`blob7`**: `region` (e.g. `Bavaria`, `California`)
- **`blob8`**: `status` (`success` | `failed` | `not_found`)
- **`blob9`**: `pseudo_client_id` (HMAC hex string)
- **`blob10`**: `city` (optional)
- **`double1`**: `asset_size_bytes`
- **`double2`**: `http_status_code`
- **`index1`**: `product` (indexed for high-speed queries)

---

## 7. Example SQL Queries for Analytics Engine

Analytics Engine datasets can be queried using the Cloudflare SQL API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: text/plain" \
     -d "$QUERY"
```

### 1. Total downloads by product
```sql
SELECT blob1 AS product, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product
ORDER BY total_downloads DESC;
```

### 2. Downloads by country
```sql
SELECT blob6 AS country, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY country
ORDER BY total_downloads DESC
LIMIT 20;
```

### 3. Downloads by region
```sql
SELECT blob6 AS country, blob7 AS region, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY country, region
ORDER BY total_downloads DESC
LIMIT 25;
```

### 4. Downloads by product and country
```sql
SELECT blob1 AS product, blob6 AS country, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product, country
ORDER BY total_downloads DESC;
```

### 5. Downloads by version
```sql
SELECT blob1 AS product, blob2 AS version, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product, version
ORDER BY total_downloads DESC;
```

### 6. Downloads by platform & architecture
```sql
SELECT blob4 AS platform, blob5 AS arch, COUNT() AS total_downloads
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY platform, arch
ORDER BY total_downloads DESC;
```

### 7. Downloads during the last 7 days
```sql
SELECT blob1 AS product, COUNT() AS downloads_7d
FROM visiongo_downloads
WHERE timestamp >= NOW() - INTERVAL '7' DAY AND blob8 = 'success'
GROUP BY product;
```

### 8. Downloads during the last 30 days
```sql
SELECT toStartOfDay(timestamp) AS day, blob1 AS product, COUNT() AS daily_downloads
FROM visiongo_downloads
WHERE timestamp >= NOW() - INTERVAL '30' DAY AND blob8 = 'success'
GROUP BY day, product
ORDER BY day ASC;
```

### 9. Approximate unique anonymous download sources
```sql
SELECT blob1 AS product, COUNT(DISTINCT blob9) AS approximate_unique_clients
FROM visiongo_downloads
WHERE blob8 = 'success'
GROUP BY product;
```

---

## 8. Future Cloudflare R2 Migration Architecture

In Phase 3, release binaries can optionally transition from GitHub Release storage to **Cloudflare R2** object storage for zero-egress fee distribution:

```
[GitHub Actions CI/CD]
        |
        | 1. Build release binaries (Linux/Windows)
        | 2. Create GitHub Release tag
        v
[Upload to Cloudflare R2 Bucket: `visiongo-releases`]
        |
        v
[Cloudflare Worker: R2DownloadProvider]
        |
        | (env.RELEASES_BUCKET.get(key))
        v
[Direct download via downloads.visiongo.app or visiongo.app/download/...]
```

The codebase is already decoupled using the `ReleaseProvider` and `DownloadProvider` interfaces in `worker/types.ts`. Switching to R2 requires implementing `R2DownloadProvider` in the Worker without modifying any frontend UI components.

---

## 9. Google Search Console Setup & SEO Verification

To verify `visiongo.app` in Google Search Console:

1. **Open Google Search Console**: Go to [https://search.google.com/search-console](https://search.google.com/search-console).
2. **Add Property**: Select **Domain property** and enter `visiongo.app`.
3. **DNS Verification**:
   - Google will provide a TXT verification record: `google-site-verification=XXXXXXXXXXXXXXXXXXXX`.
   - Log in to **Cloudflare Dashboard** > **DNS** > **Records** for `visiongo.app`.
   - Add a new **TXT** record:
     - **Name**: `@`
     - **Content**: `google-site-verification=XXXXXXXXXXXXXXXXXXXX`
     - **TTL**: Auto
4. **Click Verify**: Return to Google Search Console and click **Verify**.
5. **Submit Sitemap**:
   - Navigate to **Index** > **Sitemaps**.
   - Enter `https://visiongo.app/sitemap.xml` and click **Submit**.
   - Check that all 10 canonical routes (`/`, `/products/*`, `/solutions`, `/developers`, `/downloads`, `/contact`, `/resources`, `/about`) are indexed.

---

## 10. Privacy-Friendly Cloudflare Web Analytics

To track global website visitors without adding third-party tracking cookies or marketing pixels:

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Analytics & Logs** > **Web Analytics**.
2. Click **Add a site** and select `visiongo.app`.
3. Choose **Automatic setup via Cloudflare proxy** (zero client-side code required).
4. Cloudflare will automatically compute page views, top referrers, performance vitals, and geographical distribution directly at the edge DNS/proxy layer.

---

## 11. Local Development & Testing

```bash
# Install dependencies
pnpm install

# Typecheck TypeScript
pnpm run typecheck

# Build bundle and prerender static routes
pnpm run build

# Start local Vite development server
pnpm run dev

# Preview full Cloudflare Worker environment locally
npx wrangler dev
```

---

## 12. Security & Compliance Checklist

- [x] **No Token in Bundles**: Verified using static AST analysis and grep that `GITHUB_RELEASE_TOKEN` never appears in `dist/assets/*.js`.
- [x] **Safe Markdown Rendering**: `SafeMarkdown` AST parser ensures no raw HTML injection or XSS from GitHub descriptions.
- [x] **Strict Endpoint Validation**: `/api/download/:product/:assetId` strictly whitelists products and validates numeric IDs.
- [x] **Honeypot Spam Protection**: `/api/contact` includes hidden bot traps.
- [x] **Disallow Crawler Indexing of APIs**: `public/robots.txt` explicitly disallows `/api/` and internal download paths.
- [x] **Strict Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Pseudonymous Analytics**: Workers Analytics Engine stores keyed HMAC hashes instead of IP addresses.

---

## 13. Contacts & Channels

- **Target Domain**: [https://visiongo.app](https://visiongo.app)
- **General Inquiries**: [contact@visiongo.app](mailto:contact@visiongo.app)
- **Enterprise & OEM Licensing**: [sales@visiongo.app](mailto:sales@visiongo.app)
- **Technical Support & Integrators**: [support@visiongo.app](mailto:support@visiongo.app)
- **GitHub Repository**: [simon-shi83/website](https://github.com/simon-shi83/website)
