# China edition deployment (`ibm-rs240-lan202`)

The China edition runs the same Worker source as the international edition.
Only this directory, environment variables and `wrangler.jsonc` differ.

| | |
|:---|:---|
| Public site | `https://visiongo.com.cn` (`www` redirects to it) |
| Host directory | `~/VISIONGO/visiongo.app` |
| Runtime | bundled Node 24 in `runtime/bin/node` running `deploy/server.mjs` |
| Service | `visiongo-website.service`, loopback `127.0.0.1:8600` |
| Ingress | FRP route `visiongo-website.internal` (from `~/VISIONGO/opc/deploy/frp/frpc.toml`), Host rewritten to `visiongo.com.cn`, public Nginx in front |
| Database | `data/website.sqlite` via `deploy/database.mjs` |
| Secrets | `.env` (mode 600), never synced or overwritten |

- `server.mjs` serves `dist/` as `ASSETS`, provides the D1-compatible `DB`,
  `ctx.waitUntil`, and runs `scheduled()` every five minutes. `PUBLIC_ORIGIN`
  is required: it fixes the request origin (FRP can rewrite forwarded protocol
  headers) and defines the accepted Host names.
- `database.mjs` implements the D1 subset the Worker uses (`prepare`, `bind`,
  `first`, `all`, `run`, `batch`). Migrations in `migrations/` are applied once,
  in order, at startup; changing an applied file stops the service from starting.

## Deploy

```sh
deploy/deploy-cn.sh        # or: npm run deploy:cn
```

It builds in a clean local copy with `PUBLIC_ORIGIN=https://visiongo.com.cn`
and its ICP filing number `VITE_ICP_RECORD` (`npm test` and `npm run build:server`), backs up the database with SQLite's
online backup API into `~/VISIONGO/visiongo.app-backups/`, syncs the source,
`dist/` and `server-build/` (keeping `.env`, `data/` and `runtime/`), installs
the systemd unit if it changed, restarts the service and checks `/api/health`.
The restart needs sudo on the host.

## Operations

```sh
sudo systemctl status visiongo-website
sudo journalctl -u visiongo-website -n 50 --no-pager
curl http://127.0.0.1:8600/api/health
```

Never restore an older database backup over newer customer data, and never copy
data between this database and Cloudflare D1.
