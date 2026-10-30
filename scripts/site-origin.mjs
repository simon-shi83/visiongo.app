// Canonical origin baked into prerendered pages, sitemap and robots.txt.
// The China edition builds with PUBLIC_ORIGIN=https://visiongo.com.cn; otherwise
// the international value is read from wrangler.jsonc so both share one source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function siteOrigin() {
  let value = process.env.PUBLIC_ORIGIN;
  if (!value) {
    const config = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../wrangler.jsonc'), 'utf8');
    value = JSON.parse(config.replace(/^\s*\/\/.*$/gm, '')).vars?.PUBLIC_ORIGIN;
  }
  if (!value) throw new Error('PUBLIC_ORIGIN is not set and wrangler.jsonc has no vars.PUBLIC_ORIGIN');
  return new URL(value).origin;
}
