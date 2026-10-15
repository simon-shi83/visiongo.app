import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'shared/routes.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
assert.match(robots, /User-agent: \*/);
assert.match(robots, /Sitemap: https:\/\/visiongo\.app\/sitemap\.xml/);
assert.doesNotMatch(sitemap, /<loc>[^<]*\/(api\/|my|account|auth\/)/);
const titles = new Set();
for (const locale of ['en', 'zh']) for (const route of routes) {
  const pathname = locale === 'zh' ? (route.path === '/' ? '/zh' : `/zh${route.path}`) : route.path;
  const html = fs.readFileSync(path.join(dist, pathname.slice(1), 'index.html'), 'utf8');
  const canonical = `https://visiongo.app${pathname}`;
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${pathname}: one H1`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${pathname}: one canonical`);
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), pathname);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${pathname}: sitemap`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), `${pathname}: unique title`);
  titles.add(title);
  assert.ok(html.includes(`lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`), `${pathname}: language`);
  assert.ok(html.includes('hreflang="en"') && html.includes('hreflang="zh-CN"'), `${pathname}: alternates`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(schemas.length, 1, `${pathname}: one schema`);
  assert.equal(JSON.parse(schemas[0][1]).url, canonical);
  assert.doesNotMatch(html, /Math\.random|gh_demo_1092834|Dev verification code|Sub-millisecond determinism/);
}
for (const pathname of ['my', 'account', 'auth/desktop']) {
  const html = fs.readFileSync(path.join(dist, `${pathname}.html`), 'utf8');
  assert.match(html, /content="noindex, follow"/);
}
assert.match(fs.readFileSync(path.join(dist, '404.html'), 'utf8'), /content="noindex, follow"/);
console.log(`SEO verified: ${routes.length * 2} public snapshots, language alternates, sitemap and private-page exclusions.`);
