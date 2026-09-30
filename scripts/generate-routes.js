import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: 'products/visionstudio',
    title: 'VisionStudio — Engineering Workspace | VISIONGO',
    description: 'Build industrial vision applications. Engineering workspace for designing, configuring, debugging, and building vision pipelines.',
  },
  {
    path: 'products/visionruntime',
    title: 'VisionRuntime — Production Runtime | VISIONGO',
    description: 'Run vision applications in production. Deterministic, sub-millisecond execution engine for 24/7 industrial factory deployment.',
  },
  {
    path: 'products/visionedge',
    title: 'VisionEdge — On-site Intelligence | VISIONGO',
    description: 'Bring AI intelligence to the factory floor. 100% offline, air-gapped on-site AI for anomaly verification, drift compensation, and auto-rollback.',
  },
  {
    path: 'products/visioncloud',
    title: 'VisionCloud — Cloud Intelligence | VISIONGO',
    description: 'Extend industrial vision with cloud intelligence. Optional cloud LLM reasoning, cross-plant defect clustering, and fleet telemetrics.',
  },
  {
    path: 'solutions',
    title: 'Industrial Solutions | VISIONGO',
    description: 'Engineered vision solutions for surface defect inspection, OCR & DPM code reading, PCB inspection, and industrial AI assistance.',
  },
  {
    path: 'developers',
    title: 'Developers & SDK | VISIONGO',
    description: 'Developer documentation, standardized C++ and Python SDK bindings, verified protocol schemas, and open GitHub ecosystem.',
  },
  {
    path: 'resources',
    title: 'Technical Resources & Architecture Notes | VISIONGO',
    description: 'Articles, tutorials, case studies, and release notes on building deterministic, air-gapped industrial vision systems.',
  },
  {
    path: 'downloads',
    title: 'Download Software | VISIONGO — Industrial Vision Intelligence',
    description: 'Download official releases for VisionStudio, VisionRuntime, and VisionEdge. 100% air-gapped readiness, sub-millisecond real-time execution.',
  },
  {
    path: 'contact',
    title: 'Contact Engineering & Request Demo | VISIONGO',
    description: 'Get in touch with VISIONGO systems architects for enterprise deployments, PoC pilot evaluations, or an architecture walkthrough.',
  },
  {
    path: 'about',
    title: 'About VISIONGO — Industrial Vision Intelligence',
    description: 'Product-first software company engineering the next generation of industrial vision systems with AI.',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy | VISIONGO — Industrial Vision Intelligence',
    description: 'VISIONGO privacy policy governing website access, anonymous download analytics, and Google authentication.',
  },
  {
    path: 'terms',
    title: 'Terms of Use | VISIONGO — Industrial Vision Intelligence',
    description: 'Terms of Use governing the VISIONGO web platform, software evaluations, downloads, and account services.',
  },
];

for (const route of routes) {
  const targetDir = path.join(distDir, route.path);
  fs.mkdirSync(targetDir, { recursive: true });

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
      `<link rel="canonical" href="https://visiongo.app/${route.path}" />`
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
      `<meta property="og:url" content="https://visiongo.app/${route.path}" />`
    );

  fs.writeFileSync(path.join(targetDir, 'index.html'), html);
  console.log(`[SEO Prerender] Generated static route: /${route.path}/index.html`);
}

console.log('[SEO Prerender] All static route snapshots successfully generated.');
