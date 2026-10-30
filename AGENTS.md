# visiongo.app（website）开发准则

本文件适用于 `visiongo.app/` 目录，是根目录 `AGENTS.md` 的补充，不得削弱或绕过根目录规则。

## 1. 定位

- website 是用户、组织、成员关系和桌面访问令牌的唯一签发方。VisionStudio、VisionEdge、VisionCloud、VisionTrainer 只验证它签发的令牌，不保存密码，不维护第二套用户体系。
- 桌面登录与令牌接口的契约是 `SDK/schemas/identity.json`。website 是 TypeScript，不生成代码；改动必须通过 `SDK/tests/golden/identity/` 中样例的校验，契约变更按根目录第 3 节“SDK 先行”。

## 2. 两个版本

同一份源码（`worker/`、`src/`、`shared/`、`migrations/`）部署成两个独立的站点：

| | 国内版 | 国际版 |
|:---|:---|:---|
| 域名 | `https://visiongo.com.cn`（`www` 跳转到它） | `https://visiongo.app`、`www.visiongo.app` |
| 运行环境 | 主机 `ibm-rs240-lan202`，目录 `~/VISIONGO/visiongo.app`；独立的 Node 24（`runtime/bin/node`）通过 `deploy/server.mjs` 运行 Worker 构建产物，systemd 服务 `visiongo-website.service`，只监听 `127.0.0.1:8600`，经 FRP 与公网 nginx 对外 | 源码在 GitHub（`simon-shi83/website`），由 Cloudflare Workers 运行（`wrangler.jsonc`） |
| 数据库 | 本机 SQLite：`data/website.sqlite`，由 `deploy/database.mjs` 提供与 D1 兼容的接口 | Cloudflare D1（`visiongo_db`） |
| 密钥与配置 | 主机上的 `.env`（权限 0600） | `wrangler secret` |
| 定时任务 | `deploy/server.mjs` 内置的 5 分钟定时器 | `wrangler.jsonc` 的 cron |

规则：

- **数据各自独立**：国内版的数据只写本机 SQLite，国际版的数据只写 Cloudflare D1。两者之间不得同步、复制或互相覆盖；不得让一个版本读写另一个版本的数据库。用户需要跨版本迁移时，必须另行设计、经用户确认后用专门脚本执行。
- **代码保持一份**：业务逻辑只写在共享源码中，不得在某一个版本上直接修改代码。两个版本的差别只能出现在部署适配层（`deploy/`）、环境变量和 `wrangler.jsonc` 中。
- **只用两边都支持的能力**：Worker 代码访问数据库只能用 D1 接口中 `deploy/database.mjs` 也实现了的部分（`prepare`、`bind`、`first`、`all`、`run`、`batch`）。新增 Cloudflare 专有绑定（KV、R2、Analytics Engine、Queues 等）时，必须同时给国内版实现等价适配，或在缺少绑定时明确报错，不得静默丢数据。
- **站点地址不写死**：两个版本只用 `PUBLIC_ORIGIN` 区分（国际版在 `wrangler.jsonc` 的 `vars`，国内版在 `deploy/visiongo-website.service`）。Worker 生成链接、回调和邮件中的地址时使用请求的 origin，规范域名跳转读 `PUBLIC_ORIGIN`；构建时的 canonical、hreflang、sitemap、robots 由 `scripts/site-origin.mjs` 取值，`index.html` 与 `public/` 中的绝对地址写成 `__SITE_ORIGIN__`。不得把 `visiongo.app` 或 `visiongo.com.cn` 作为站点地址写进业务代码。
- **默认语言**：国内版在 `deploy/visiongo-website.service` 中设置 `DEFAULT_LOCALE=zh`，没有主动选择语言（Cookie `visiongo_locale`）的访问者从英文地址 302 到对应中文地址；国际版不设置，默认英文。
- **迁移只追加**：`migrations/` 中已发布的文件不得修改。国内版启动时按顺序执行未执行过的迁移并校验已执行文件的 sha256，改动旧文件会导致服务无法启动；国际版用 `wrangler d1 migrations apply visiongo_db --remote`。
- **令牌签名**：两个版本目前都使用 `iss=https://visiongo.app`、`kid=website-desktop-1`，但签名私钥各不相同（国内版 2026-10-28 起使用独立的生产密钥）。私钥只存在于各自的 `.env` 或 Cloudflare Secret，不得进入仓库或其他主机。各服务信任哪个版本、是否区分两个版本的签名，按 `docs/architecture/authentication.md` 执行。

## 3. 开发与测试

- 使用 Node 24 或更新版本（Worker 测试依赖 `node:sqlite`）。
- `npm test`：类型检查、构建、SEO 校验和 Worker 测试（内存 SQLite，以及 `scripts/deploy.test.mjs` 对 `deploy/database.mjs` 的测试）。默认按国际版地址构建。
- 国内版构建：`PUBLIC_ORIGIN=https://visiongo.com.cn VITE_ICP_RECORD=沪ICP备16001251号-3 npm test && npm run build:server`（`deploy/deploy-cn.sh` 已内置这两个值）。页脚的 ICP 备案号只由国内版构建传入，国际版不显示。
- 不提交 `.env`、`.dev.vars`、`data/`、`dist/`、`server-build/`、`runtime/`。

## 4. 部署

website 修改后两个版本都要部署，并在回复中分别说明结果；任一版本失败或被跳过都要如实说明。

- **国内版**（`ibm-rs240-lan202`）：
  1. 执行 `deploy/deploy-cn.sh`：在本地干净副本中按国内版地址构建 `dist/` 和 `server-build/`（主机没有 npm，不在主机上构建），再同步源码与产物到 `~/VISIONGO/visiongo.app`；
  2. 不得覆盖主机上的 `.env`、`data/` 和 `runtime/`；
  3. 脚本在同步前用 SQLite 在线备份 API 把 `data/website.sqlite` 备份到 `~/VISIONGO/visiongo.app-backups/`；
  4. 脚本重启 `visiongo-website` 并检查 `curl http://127.0.0.1:8600/api/health` 与 `journalctl -u visiongo-website`。
- **国际版**（GitHub + Cloudflare）：
  1. 提交并推送到 GitHub（提交由用户执行时，等用户推送后再部署）；
  2. 有迁移时先执行 `wrangler d1 migrations apply visiongo_db --remote`；
  3. `wrangler deploy`，访问 `https://visiongo.app/api/health` 确认正常。
- 不得把较旧的数据库备份恢复到较新的客户数据上。

## 5. 提交前检查

1. 改动是否只在共享源码中，部署差异是否只在 `deploy/`、环境变量和 `wrangler.jsonc` 中？
2. 新的数据库访问或平台能力在国内版的 Node + SQLite 环境下能否工作？
3. 迁移是否为新增文件，并能分别在 SQLite 与 D1 上执行？
4. 是否有写死的站点域名？
5. 令牌声明和接口是否仍符合 `identity.json` 与 golden 样例？
6. 两个版本是否都已部署并确认健康？
