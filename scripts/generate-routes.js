import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'shared/routes.json'), 'utf8'));
const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8').replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const local = (route, locale) => locale === 'zh' ? (route === '/' ? '/zh' : `/zh${route}`) : route;
const title = value => value.includes('VISIONGO') ? value : `${value} | VISIONGO`;
const vite = await createServer({ root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
const urls = [];
try {
  const { App } = await vite.ssrLoadModule('/src/App.tsx');
  const ssrPages = {};
  for (const file of fs.readdirSync(path.join(root, 'src/pages')).filter(file => file.endsWith('.tsx'))) ssrPages[file.slice(0, -4)] = await vite.ssrLoadModule(`/src/pages/${file}`);
  const render = (route, locale, privatePage = false) => {
    const routePath = local(route.path, locale);
    const canonical = `https://visiongo.app${routePath}`;
    const pageTitle = title(route.title[locale]);
    const description = route.description[locale];
    const body = renderToString(React.createElement(App, { initialPath: routePath, initialLocale: locale, ssrPages }));
    let html = base.replace(/<html lang="[^"]*"/, `<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(pageTitle)}</title>`)
      .replace('<div id="root"></div>', `<div id="root" data-page="${routePath}">${body}</div>`);
    const metas = [
      ['name', 'title', pageTitle], ['name', 'description', description], ['name', 'robots', privatePage ? 'noindex, follow' : 'index, follow'],
      ['property', 'og:title', pageTitle], ['property', 'og:description', description], ['property', 'og:url', canonical],
      ['property', 'twitter:title', pageTitle], ['property', 'twitter:description', description], ['property', 'twitter:url', canonical],
    ];
    for (const [attr, key, value] of metas) html = html.replace(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[\\s\\S]*?"\\s*\\/>`), `<meta ${attr}="${key}" content="${escape(value)}" />`);
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
    if (!privatePage) {
      const links = [['en', local(route.path, 'en')], ['zh-CN', local(route.path, 'zh')], ['x-default', local(route.path, 'en')]].map(([lang, pathname]) => `<link rel="alternate" hreflang="${lang}" href="https://visiongo.app${pathname}" />`).join('\n');
      const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: pageTitle, description, url: canonical, inLanguage: locale === 'zh' ? 'zh-CN' : 'en' }).replaceAll('<', '\\u003c');
      html = html.replace('</head>', `${links}\n<meta property="og:locale" content="${locale === 'zh' ? 'zh_CN' : 'en_US'}" />\n<script type="application/ld+json">${schema}</script>\n</head>`);
      urls.push(canonical);
    }
    const relative = routePath === '/' ? '' : routePath.slice(1);
    const directory = path.join(dist, relative);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), html);
    if (relative) fs.writeFileSync(path.join(dist, `${relative}.html`), html);
    else fs.writeFileSync(path.join(dist, 'home.html'), html);
  };
  for (const locale of ['en', 'zh']) for (const route of routes) render(route, locale);
  // Auth pages contain no user data and are excluded from indexing and sitemap.
  for (const pathname of ['/my', '/account', '/auth/desktop']) render({ path: pathname, title: { en: 'Account' }, description: { en: 'VISIONGO account sign-in.' } }, 'en', true);
  const notFound = base.replace(/<title>.*?<\/title>/, '<title>404 — Page not found | VISIONGO</title>')
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, follow" />')
    .replace('<div id="root"></div>', '<div id="root"><main><h1>404 — Page not found</h1><a href="/">Back to home</a></main></div>');
  fs.writeFileSync(path.join(dist, '404.html'), notFound);
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
  console.log(`Prerendered ${urls.length} public pages plus account pages and 404.`);
} finally { await vite.close(); }
