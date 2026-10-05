import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: '',
    fullPath: '/',
    title: 'VISIONGO — Industrial Vision Intelligence',
    description: 'Build, run, and improve industrial vision systems with AI using VisionStudio, VisionRuntime, VisionEdge, and VisionCloud.',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://visiongo.app/#organization',
          'name': 'VISIONGO',
          'url': 'https://visiongo.app/',
          'logo': 'https://visiongo.app/favicon.svg',
          'description': 'Industrial Vision Intelligence platform to build, run, and improve industrial vision systems with AI.',
          'sameAs': ['https://github.com/simon-shi83']
        },
        {
          '@type': 'WebSite',
          '@id': 'https://visiongo.app/#website',
          'url': 'https://visiongo.app/',
          'name': 'VISIONGO',
          'description': 'Industrial Vision Intelligence — Build, run, and improve industrial vision systems with AI.',
          'publisher': { '@id': 'https://visiongo.app/#organization' }
        }
      ]
    }
  },
  {
    path: 'products/visionstudio',
    fullPath: '/products/visionstudio',
    title: 'VisionStudio — Industrial Vision Engineering Workspace | VISIONGO',
    description: 'Engineering workspace for designing, configuring, debugging, and building industrial machine vision pipelines.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'VisionStudio',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Linux, Windows',
      'description': 'Industrial vision engineering workspace for designing, configuring, debugging, and building vision pipelines.',
      'url': 'https://visiongo.app/products/visionstudio',
      'publisher': { '@type': 'Organization', 'name': 'VISIONGO', 'url': 'https://visiongo.app' }
    }
  },
  {
    path: 'products/visionruntime',
    fullPath: '/products/visionruntime',
    title: 'VisionRuntime — Production Runtime for Industrial Vision | VISIONGO',
    description: 'Deterministic, sub-millisecond production execution engine for 24/7 industrial machine vision deployment.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'VisionRuntime',
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Linux',
      'description': 'Deterministic, sub-millisecond production runtime for 24/7 industrial machine vision deployment.',
      'url': 'https://visiongo.app/products/visionruntime',
      'publisher': { '@type': 'Organization', 'name': 'VISIONGO', 'url': 'https://visiongo.app' }
    }
  },
  {
    path: 'products/visionedge',
    fullPath: '/products/visionedge',
    title: 'VisionEdge — On-site AI for Industrial Vision | VISIONGO',
    description: '100% offline, air-gapped on-site AI intelligence for anomaly verification, drift compensation, and industrial edge computing.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'VisionEdge',
      'applicationCategory': 'IndustrialApplication',
      'operatingSystem': 'Linux',
      'description': '100% offline, air-gapped on-site AI intelligence for anomaly verification, drift compensation, and industrial edge computing.',
      'url': 'https://visiongo.app/products/visionedge',
      'publisher': { '@type': 'Organization', 'name': 'VISIONGO', 'url': 'https://visiongo.app' }
    }
  },
  {
    path: 'products/visioncloud',
    fullPath: '/products/visioncloud',
    title: 'VisionCloud — Cloud Intelligence for Industrial Vision | VISIONGO',
    description: 'Cloud intelligence for industrial vision systems. Cross-plant defect analytics, fleet orchestration, and AI model improvement.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'VisionCloud',
      'applicationCategory': 'CloudApplication',
      'description': 'Cloud intelligence for industrial vision systems. Cross-plant defect analytics, fleet orchestration, and AI model improvement.',
      'url': 'https://visiongo.app/products/visioncloud',
      'publisher': { '@type': 'Organization', 'name': 'VISIONGO', 'url': 'https://visiongo.app' }
    }
  },
  {
    path: 'solutions',
    fullPath: '/solutions',
    title: 'Industrial Solutions — Machine Vision Systems | VISIONGO',
    description: 'Engineered vision solutions for surface defect inspection, high-speed OCR/DPM reading, PCB verification, and robotics.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Industrial Solutions | VISIONGO',
      'description': 'Engineered vision solutions for surface defect inspection, OCR & DPM code reading, PCB inspection, and industrial AI assistance.',
      'url': 'https://visiongo.app/solutions'
    }
  },
  {
    path: 'developers',
    fullPath: '/developers',
    title: 'Developers — VISIONGO Industrial Vision Platform',
    description: 'Developer documentation, standardized C++ and Python SDK bindings, verified protocol schemas, and open GitHub ecosystem.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'headline': 'Developers & SDK | VISIONGO',
      'description': 'Developer documentation, standardized C++ and Python SDK bindings, verified protocol schemas, and open GitHub ecosystem.',
      'url': 'https://visiongo.app/developers'
    }
  },
  {
    path: 'resources',
    fullPath: '/resources',
    title: 'Resources — Industrial Vision & AI | VISIONGO',
    description: 'Articles, architecture notes, case studies, and engineering guides for deterministic industrial computer vision.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'Technical Resources & Architecture Notes | VISIONGO',
      'description': 'Articles, architecture notes, case studies, and engineering guides for deterministic industrial computer vision.',
      'url': 'https://visiongo.app/resources'
    }
  },
  {
    path: 'downloads',
    fullPath: '/downloads',
    title: 'Downloads — VISIONGO Industrial Vision Software',
    description: 'Download official releases of VisionStudio, VisionRuntime, and VisionEdge. Air-gapped deployment, high-throughput machine vision software.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'VISIONGO Software Downloads',
      'description': 'Download official releases for VisionStudio, VisionRuntime, and VisionEdge industrial vision software.',
      'url': 'https://visiongo.app/downloads',
      'publisher': { '@type': 'Organization', 'name': 'VISIONGO', 'url': 'https://visiongo.app' }
    }
  },
  {
    path: 'about',
    fullPath: '/about',
    title: 'About VISIONGO — Industrial Vision Intelligence',
    description: 'VISIONGO builds industrial vision intelligence — engineering modern software tools and runtimes for manufacturing and automation.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'name': 'About VISIONGO',
      'description': 'Product-first software company engineering the next generation of industrial vision systems with AI.',
      'url': 'https://visiongo.app/about'
    }
  },
  {
    path: 'contact',
    fullPath: '/contact',
    title: 'Contact Engineering & Enterprise Inquiries | VISIONGO',
    description: 'Contact VISIONGO engineers and architecture specialists for technical inquiries, pilot evaluations, and enterprise deployments.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      'name': 'Contact Engineering & Enterprise Inquiries | VISIONGO',
      'description': 'Contact VISIONGO systems architects for enterprise deployments, PoC pilot evaluations, or an architecture walkthrough.',
      'url': 'https://visiongo.app/contact'
    }
  },
  {
    path: 'privacy',
    fullPath: '/privacy',
    title: 'Privacy Policy | VISIONGO — Industrial Vision Intelligence',
    description: 'VISIONGO privacy policy governing website access, privacy-preserving download analytics, and Google authentication.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Privacy Policy | VISIONGO',
      'description': 'VISIONGO privacy policy governing website access, privacy-preserving download analytics, and Google authentication.',
      'url': 'https://visiongo.app/privacy'
    }
  },
  {
    path: 'terms',
    fullPath: '/terms',
    title: 'Terms of Use | VISIONGO — Industrial Vision Intelligence',
    description: 'Terms of use governing VISIONGO website usage, software evaluations, downloads, and account services.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Terms of Use | VISIONGO',
      'description': 'Terms of use governing the VISIONGO web platform, software evaluations, downloads, and account services.',
      'url': 'https://visiongo.app/terms'
    }
  },
];

async function generateAllRoutes() {
  console.log('[SEO Prerender] Starting Vite SSR renderer for static snapshots...');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { App } = await vite.ssrLoadModule('/src/App.tsx');

    for (const route of routes) {
      const canonicalUrl = route.path === '' ? 'https://visiongo.app/' : `https://visiongo.app/${route.path}`;
      
      // Render React component to real semantic HTML string
      const appElement = React.createElement(App, { initialPath: route.fullPath });
      const renderedBody = renderToString(appElement);

      const jsonLdScript = route.schema
        ? `<script type="application/ld+json">${JSON.stringify(route.schema)}</script>`
        : '';

      let html = baseHtml
        .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
        .replace(
          /<meta\s+name="title"\s+content=".*?"\s*\/>/,
          `<meta name="title" content="${route.title}" />`
        )
        .replace(
          /<meta\s+name="description"\s+content=".*?"\s*\/>/,
          `<meta name="description" content="${route.description}" />`
        )
        .replace(
          /<link\s+rel="canonical"\s+href=".*?"\s*\/>/,
          `<link rel="canonical" href="${canonicalUrl}" />`
        )
        .replace(
          /<meta\s+property="og:title"\s+content=".*?"\s*\/>/,
          `<meta property="og:title" content="${route.title}" />`
        )
        .replace(
          /<meta\s+property="og:description"\s+content=".*?"\s*\/>/,
          `<meta property="og:description" content="${route.description}" />`
        )
        .replace(
          /<meta\s+property="og:url"\s+content=".*?"\s*\/>/,
          `<meta property="og:url" content="${canonicalUrl}" />`
        )
        .replace(
          /<meta\s+property="twitter:title"\s+content=".*?"\s*\/>/,
          `<meta property="twitter:title" content="${route.title}" />`
        )
        .replace(
          /<meta\s+property="twitter:description"\s+content=".*?"\s*\/>/,
          `<meta property="twitter:description" content="${route.description}" />`
        )
        .replace(
          /<meta\s+property="twitter:url"\s+content=".*?"\s*\/>/,
          `<meta property="twitter:url" content="${canonicalUrl}" />`
        )
        // Replace root div with full rendered HTML
        .replace('<div id="root"></div>', `<div id="root">${renderedBody}</div>`);

      // Inject JSON-LD before </head>
      if (jsonLdScript) {
        html = html.replace('</head>', `  ${jsonLdScript}\n  </head>`);
      }

      if (route.path === '') {
        // Root page: write both index.html and home.html
        fs.writeFileSync(path.join(distDir, 'index.html'), html);
        fs.writeFileSync(path.join(distDir, 'home.html'), html);
        console.log(`[SEO Prerender] Wrote rendered / (dist/index.html + home.html) [${renderedBody.length} bytes HTML]`);
      } else {
        const targetDir = path.join(distDir, route.path);
        fs.mkdirSync(targetDir, { recursive: true });

        // Write both /route/index.html and /route.html to support all asset fetch patterns
        fs.writeFileSync(path.join(targetDir, 'index.html'), html);
        fs.writeFileSync(path.join(distDir, `${route.path}.html`), html);
        console.log(`[SEO Prerender] Wrote rendered /${route.path} (/index.html + .html) [${renderedBody.length} bytes HTML]`);
      }
    }

    // Generate 404.html
    const notFoundHtml = baseHtml
      .replace(/<title>.*?<\/title>/, '<title>404: Page Not Found | VISIONGO</title>')
      .replace(/<meta\s+name="robots"\s+content=".*?"\s*\/>/, '<meta name="robots" content="noindex, nofollow" />')
      .replace('<div id="root"></div>', `
        <div id="root">
          <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-6">
              404 NOT FOUND
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Page Not Found
            </h1>
            <p class="text-zinc-400 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
              The requested resource or page does not exist on the VISIONGO platform. Check the URL or return to the homepage.
            </p>
            <a href="/" class="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition-colors shadow-lg shadow-emerald-500/20">
              Return to Homepage
            </a>
          </div>
        </div>
      `);
    fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml);
    console.log('[SEO Prerender] Wrote custom 404 page (dist/404.html)');

    // Generate SPA shell for client-side authenticated routes: /my, /account
    fs.writeFileSync(path.join(distDir, 'my.html'), baseHtml);
    fs.writeFileSync(path.join(distDir, 'account.html'), baseHtml);
    console.log('[SPA Prerender] Wrote client app shells: my.html, account.html');

  } finally {
    await vite.close();
  }

  console.log('[SEO Prerender] All 13 routes successfully pre-rendered with semantic HTML!');
}

generateAllRoutes().catch((err) => {
  console.error('[SEO Prerender Fatal Error]:', err);
  process.exit(1);
});
