# VISIONGO Official Website

> **Industrial Vision Intelligence**  
> *Build, run, and improve industrial vision systems with AI.*  
> Production Domain: [https://visiongo.app](https://visiongo.app)

---

## 1. Project Overview & Architectural Principles

This repository contains the official, product-first website for **VISIONGO** ([visiongo.app](https://visiongo.app)), built for overseas industrial automation engineers, vision system integrators, and enterprise manufacturing teams.

### Core Product Suite
- **VisionStudio** (`/products/visionstudio`): *Engineering Workspace* — Build industrial vision applications with visual pipeline graphs, hardware simulators, and camera calibration.
- **VisionRuntime** (`/products/visionruntime`): *Production Runtime* — Deterministic execution engine for 24/7 factory lines, handling GigE/USB3 cameras, zero-copy framebuffer DMA, and sub-millisecond PLC triggers.
- **VisionEdge** (`/products/visionedge`): *On-site Intelligence* — 100% offline, air-gapped local AI intelligence for autonomous defect verification, drift compensation, and automated rollback.
- **VisionCloud** (`/products/visioncloud`): *Cloud Intelligence* — Strictly optional cloud layer for multimodal LLM reasoning, cross-plant defect clustering, and fleet telemetrics.

*Note on Architecture:* The internal technical software umbrella is the VisionAgent system (comprising VisionStudio, VisionRuntime, VisionEdge, and VisionCloud), connected strictly via standardized SDK schema contracts.

---

## 2. Technology Stack

- **Framework**: React 18 + TypeScript (Strict Mode)
- **Bundler**: Vite
- **Styling**: Tailwind CSS with custom industrial tokens (`Plus Jakarta Sans` + `JetBrains Mono`)
- **Icons**: Lucide React
- **Edge Deployment**: Cloudflare Workers with Static Assets (`wrangler.jsonc`)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)

---

## 3. Local Development

### Prerequisites
- Node.js >= 20.x
- `pnpm` >= 9.x (or `npm`)

### Installation
```bash
# Clone the repository
git clone git@github.com:simon-shi83/website.git
cd website

# Install dependencies
pnpm install
```

### Start Development Server
```bash
pnpm run dev
```
The local development server will start at `http://localhost:3000`.

### Typecheck & Production Build
```bash
# Run TypeScript validation
pnpm run typecheck

# Build optimized static assets into dist/
pnpm run build
```

---

## 4. Cloudflare Workers Deployment Architecture

The website is designed for zero-server-maintenance deployment directly to **Cloudflare Workers** using the official Workers Static Assets engine.

### Configuration File (`wrangler.jsonc`)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "visiongo-website",
  "main": "worker/index.ts",
  "compatibility_date": "2024-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "html_handling": "auto-trailing-slash"
  },
  "observability": {
    "enabled": true
  },
  "routes": [
    {
      "pattern": "visiongo.app/*",
      "zone_name": "visiongo.app",
      "custom_domain": true
    },
    {
      "pattern": "www.visiongo.app/*",
      "zone_name": "visiongo.app",
      "custom_domain": true
    }
  ]
}
```

### Manual Deployment via CLI
```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Preview locally with Wrangler
npx wrangler dev

# 3. Deploy directly to Cloudflare Workers
npx wrangler deploy
```

---

## 5. Domain & DNS Configuration for `visiongo.app`

To link `visiongo.app` to your Cloudflare Worker:

### Step 1: Add Domain to Cloudflare
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click **Add a Domain** and input `visiongo.app`.
3. Choose the Free or Pro plan.
4. Update the nameservers at your domain registrar (Namecheap, GoDaddy, Porkbun, etc.) to the assigned Cloudflare nameservers (e.g., `aria.ns.cloudflare.com` and `dane.ns.cloudflare.com`).

### Step 2: Configure Custom Domain in Workers
1. In Cloudflare Dashboard, navigate to **Compute (Workers & Pages)** > **visiongo-website**.
2. Go to **Settings** > **Domains & Routes** > **Add**.
3. Select **Custom Domain** and enter:
   - `visiongo.app`
   - `www.visiongo.app`
4. Cloudflare will automatically provision the SSL/TLS certificate and configure DNS routing.

### Step 3: DNS Records Verification
In **DNS** > **Records** for `visiongo.app`:
| Type  | Name | Content | Proxy status |
|-------|------|---------|--------------|
| CNAME | @    | `visiongo-website.<your-subdomain>.workers.dev` | Proxied (Orange Cloud) |
| CNAME | www  | `visiongo.app` | Proxied (Orange Cloud) |

---

## 6. GitHub Actions Continuous Deployment (CI/CD)

Every commit pushed to the `main` branch automatically builds and deploys to Cloudflare Workers.

### Setup GitHub Secrets
Navigate to your GitHub repository: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**:
1. `CLOUDFLARE_API_TOKEN`:
   - Generated in Cloudflare Dashboard: **My Profile** > **API Tokens** > **Create Token** > **Edit Cloudflare Workers** template.
2. `CLOUDFLARE_ACCOUNT_ID`:
   - Found on the right sidebar of your Cloudflare Dashboard overview page.

Once configured, any `git push origin main` triggers `.github/workflows/deploy.yml` to build the app and deploy globally within seconds.

---

## 7. Project Structure

```
website/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── public/
│   ├── favicon.svg             # Modern geometric aperture vector logo
│   ├── robots.txt              # Search engine crawler policies
│   └── sitemap.xml             # XML sitemap for SEO discovery
├── src/
│   ├── components/
│   │   ├── ArchitectureDiagram.tsx # Interactive Studio-Runtime-Edge-Cloud architecture
│   │   ├── ContactModal.tsx    # Enterprise consultation modal
│   │   ├── Footer.tsx          # Technical footer with product links & contacts
│   │   ├── Navbar.tsx          # Sticky navigation with product dropdown
│   │   ├── ProductCard.tsx     # Reusable product suite card component
│   │   ├── SectionHeader.tsx   # Consistent technical badge and typography
│   │   ├── SeoHead.tsx         # Dynamic SEO & OpenGraph metadata injector
│   │   └── TerminalDemo.tsx    # Real-time industrial telemetry simulation
│   ├── data/
│   │   ├── developerResources.ts # Documentation, SDK specs, architecture notes
│   │   ├── products.ts         # Single Source of Truth for the 4 core products
│   │   ├── resources.ts        # Technical articles, tutorials, and case studies
│   │   └── solutions.ts        # Turnkey inspection applications (AOI, DPM, PCB)
│   ├── pages/
│   │   ├── AboutPage.tsx       # Brand mission, OT principles, contact info
│   │   ├── DevelopersPage.tsx  # C++ / Python SDK code viewer, GitHub community
│   │   ├── HomePage.tsx        # 8-section homepage with Hero, Architecture & Products
│   │   ├── ProductPage.tsx     # Deep-dive specs for each product
│   │   ├── ResourcesPage.tsx   # Articles reader, guides, and changelog
│   │   └── SolutionsPage.tsx   # Industry inspection breakdown & recommended stacks
│   ├── types/
│   │   └── index.ts            # Core TypeScript interfaces
│   ├── App.tsx                 # Router, layout orchestration, navigation state
│   ├── index.css               # Design system tokens, JetBrains Mono, grid styling
│   └── main.tsx                # React DOM mount point
├── worker/
│   └── index.ts                # Cloudflare Worker script (Edge APIs + Static Assets)
├── index.html                  # HTML entry with OpenGraph, JSON-LD, fonts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js          # Industrial theme tokens & dark palette
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts              # Bundler configuration
└── wrangler.jsonc              # Cloudflare Workers configuration
```

---

## 8. SEO & Performance Guarantees

- **Semantic HTML5**: Native `header`, `nav`, `main`, `section`, `footer` elements.
- **Dynamic Meta Tags**: Dynamic `title`, `description`, `canonical`, and OpenGraph tags per route.
- **Search Engine Discovery**: `robots.txt` and `sitemap.xml` pointing to `https://visiongo.app`.
- **JSON-LD Structured Data**: Embedded software application schema in `index.html`.
- **Zero Heavy Assets**: Pure SVG vectors, CSS grid patterns, and zero bulky image payloads for instant 100/100 Lighthouse performance.

---

## 9. Contact & Inquiries

- **Official Domain**: [https://visiongo.app](https://visiongo.app)
- **General Inquiries**: [contact@visiongo.app](mailto:contact@visiongo.app)
- **Sales & Enterprise Pilots**: [sales@visiongo.app](mailto:sales@visiongo.app)
- **Technical Support**: [support@visiongo.app](mailto:support@visiongo.app)
- **GitHub Repository**: [simon-shi83/website](https://github.com/simon-shi83/website)
