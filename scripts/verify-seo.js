import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const EXPECTED_ROUTES = [
  { path: '', canonical: 'https://visiongo.app/', file: 'index.html', titleContains: 'VISIONGO' },
  { path: 'products/visionstudio', canonical: 'https://visiongo.app/products/visionstudio', file: 'products/visionstudio/index.html', titleContains: 'VisionStudio' },
  { path: 'products/visionruntime', canonical: 'https://visiongo.app/products/visionruntime', file: 'products/visionruntime/index.html', titleContains: 'VisionRuntime' },
  { path: 'products/visionedge', canonical: 'https://visiongo.app/products/visionedge', file: 'products/visionedge/index.html', titleContains: 'VisionEdge' },
  { path: 'products/visioncloud', canonical: 'https://visiongo.app/products/visioncloud', file: 'products/visioncloud/index.html', titleContains: 'VisionCloud' },
  { path: 'solutions', canonical: 'https://visiongo.app/solutions', file: 'solutions/index.html', titleContains: 'Industrial Solutions' },
  { path: 'developers', canonical: 'https://visiongo.app/developers', file: 'developers/index.html', titleContains: 'Developers' },
  { path: 'downloads', canonical: 'https://visiongo.app/downloads', file: 'downloads/index.html', titleContains: 'Downloads' },
  { path: 'resources', canonical: 'https://visiongo.app/resources', file: 'resources/index.html', titleContains: 'Resources' },
  { path: 'about', canonical: 'https://visiongo.app/about', file: 'about/index.html', titleContains: 'About' },
  { path: 'contact', canonical: 'https://visiongo.app/contact', file: 'contact/index.html', titleContains: 'Contact' },
  { path: 'privacy', canonical: 'https://visiongo.app/privacy', file: 'privacy/index.html', titleContains: 'Privacy Policy' },
  { path: 'terms', canonical: 'https://visiongo.app/terms', file: 'terms/index.html', titleContains: 'Terms of Use' },
];

function runVerification() {
  console.log('=== VISIONGO Build-Time SEO Verification ===\n');
  let errors = 0;
  let warnings = 0;

  // 1. Verify robots.txt
  console.log('[1/4] Checking robots.txt...');
  const robotsPath = path.join(distDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    console.error('  ❌ Error: dist/robots.txt is missing!');
    errors++;
  } else {
    const robotsTxt = fs.readFileSync(robotsPath, 'utf-8');
    if (!robotsTxt.includes('User-agent: *')) {
      console.error('  ❌ Error: robots.txt missing User-agent: *');
      errors++;
    }
    if (!robotsTxt.includes('Allow: /')) {
      console.error('  ❌ Error: robots.txt missing Allow: /');
      errors++;
    }
    if (robotsTxt.includes('Disallow: /') && !robotsTxt.includes('Disallow: /api/')) {
      console.error('  ❌ Error: robots.txt accidentally disallows entire root (Disallow: /)!');
      errors++;
    }
    if (!robotsTxt.includes('Sitemap: https://visiongo.app/sitemap.xml')) {
      console.error('  ❌ Error: robots.txt missing sitemap reference!');
      errors++;
    }
    console.log('  ✅ robots.txt verified (Allows root, disallows private endpoints, references sitemap)');
  }

  // 2. Verify sitemap.xml
  console.log('\n[2/4] Checking sitemap.xml...');
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('  ❌ Error: dist/sitemap.xml is missing!');
    errors++;
  } else {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
    if (!sitemapXml.startsWith('<?xml')) {
      console.error('  ❌ Error: sitemap.xml does not begin with XML declaration');
      errors++;
    }
    for (const r of EXPECTED_ROUTES) {
      if (!sitemapXml.includes(`<loc>${r.canonical}</loc>`)) {
        console.error(`  ❌ Error: sitemap.xml missing route ${r.canonical}`);
        errors++;
      }
    }
    if (sitemapXml.includes('/api/') || sitemapXml.includes('/my') || sitemapXml.includes('/account')) {
      console.error('  ❌ Error: sitemap.xml contains private routes (/api/, /my, or /account)!');
      errors++;
    }
    console.log(`  ✅ sitemap.xml verified (Contains all ${EXPECTED_ROUTES.length} canonical public URLs, no private routes)`);
  }

  // 3. Verify HTML snapshots for each route
  console.log('\n[3/4] Checking HTML snapshots and metadata...');
  const seenCanonicals = new Set();
  const seenTitles = new Set();

  for (const r of EXPECTED_ROUTES) {
    const filePath = path.join(distDir, r.file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ Error: Missing pre-rendered HTML snapshot: ${r.file}`);
      errors++;
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf-8');

    // Title check
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (!titleMatch || !titleMatch[1].trim()) {
      console.error(`  ❌ Error: Missing <title> in ${r.file}`);
      errors++;
    } else {
      const title = titleMatch[1];
      if (!title.includes(r.titleContains)) {
        console.error(`  ❌ Error: Title in ${r.file} ("${title}") does not contain "${r.titleContains}"`);
        errors++;
      }
      if (seenTitles.has(title)) {
        console.error(`  ❌ Error: Duplicate title across pages: "${title}" in ${r.file}`);
        errors++;
      }
      seenTitles.add(title);
    }

    // Meta description check
    const descMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"\s*\/>/);
    if (!descMatch || !descMatch[1].trim()) {
      console.error(`  ❌ Error: Missing meta description in ${r.file}`);
      errors++;
    }

    // Canonical link check
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="(.*?)"\s*\/>/);
    if (!canonMatch || canonMatch[1] !== r.canonical) {
      console.error(`  ❌ Error: Canonical in ${r.file} is "${canonMatch ? canonMatch[1] : 'MISSING'}", expected "${r.canonical}"`);
      errors++;
    } else {
      if (seenCanonicals.has(canonMatch[1])) {
        console.error(`  ❌ Error: Duplicate canonical URL "${canonMatch[1]}" in ${r.file}`);
        errors++;
      }
      seenCanonicals.add(canonMatch[1]);
    }

    // OpenGraph & Twitter
    if (!html.includes('property="og:title"') || !html.includes('property="og:description"') || !html.includes('property="og:image"')) {
      console.error(`  ❌ Error: Missing OpenGraph meta tags in ${r.file}`);
      errors++;
    }

    // Semantic H1
    if (!html.includes('<h1')) {
      console.error(`  ❌ Error: Missing <h1> tag in pre-rendered body in ${r.file}`);
      errors++;
    }

    // Semantic content (non-empty root div)
    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>/);
    if (!rootMatch || rootMatch[1].trim().length < 200) {
      console.error(`  ❌ Error: <div id="root"> in ${r.file} is empty or lacks SSR content!`);
      errors++;
    }

    // Robots noindex check
    if (html.includes('content="noindex') || html.includes("content='noindex")) {
      console.error(`  ❌ Error: Public page ${r.file} contains accidental noindex tag!`);
      errors++;
    }

    // JSON-LD check
    if (!html.includes('application/ld+json')) {
      console.warn(`  ⚠️ Warning: ${r.file} lacks JSON-LD structured data`);
      warnings++;
    }
  }

  // 4. Verify 404.html
  console.log('\n[4/4] Checking custom 404 page...');
  const notFoundPath = path.join(distDir, '404.html');
  if (!fs.existsSync(notFoundPath)) {
    console.error('  ❌ Error: dist/404.html is missing!');
    errors++;
  } else {
    const notFoundHtml = fs.readFileSync(notFoundPath, 'utf-8');
    if (!notFoundHtml.includes('noindex')) {
      console.error('  ❌ Error: 404.html must have noindex tag!');
      errors++;
    }
    if (!notFoundHtml.includes('404')) {
      console.error('  ❌ Error: 404.html missing 404 heading/text!');
      errors++;
    }
    console.log('  ✅ 404.html verified (Contains noindex and 404 message)');
  }

  console.log('\n=== Verification Summary ===');
  console.log(`Routes checked: ${EXPECTED_ROUTES.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);

  if (errors > 0) {
    console.error('\n❌ SEO verification failed! Please fix the errors above.');
    process.exit(1);
  }

  console.log('\n✅ All SEO and crawler accessibility checks PASSED!');
}

runVerification();
