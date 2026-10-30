#!/usr/bin/env bash
# Builds the China edition locally and deploys it to ibm-rs240-lan202.
# The host keeps its own .env, data/ and runtime/; they are never overwritten.
# SKIP_RESTART=1 syncs only; the restart (sudo) is then run on the host.
set -euo pipefail

HOST="${DEPLOY_HOST:-ibm-rs240-lan202}"
REMOTE_DIR="${DEPLOY_DIR:-VISIONGO/visiongo.app}"
ORIGIN="https://visiongo.com.cn"
# MIIT filing number, required in the footer of the China edition.
ICP_RECORD="沪ICP备16001251号-3"
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

# Anchored to the project root so src/data/ and similar directories are kept.
EXCLUDES=(--exclude /.git --exclude /node_modules --exclude /dist --exclude /server-build --exclude /data
          --exclude /runtime --exclude /.wrangler --exclude /.env --exclude /.env.local --exclude /.dev.vars)

echo "==> Building $ORIGIN in a clean copy"
rsync -a "${EXCLUDES[@]}" "$SOURCE/" "$BUILD/"
ln -s "$SOURCE/node_modules" "$BUILD/node_modules"
(cd "$BUILD" && PUBLIC_ORIGIN="$ORIGIN" VITE_ICP_RECORD="$ICP_RECORD" npm test && npm run build:server)

echo "==> Backing up the database on $HOST"
ssh "$HOST" "cd $REMOTE_DIR && mkdir -p -m 700 ../visiongo.app-backups && runtime/bin/node -e '
const { DatabaseSync, backup } = require(\"node:sqlite\");
const target = \"../visiongo.app-backups/website-\" + new Date().toISOString().replace(/[:.]/g, \"-\") + \".sqlite\";
const db = new DatabaseSync(\"data/website.sqlite\", { readOnly: true });
backup(db, target).then(() => { db.close(); console.log(\"backup:\", target); });'"

echo "==> Syncing source and build output"
rsync -a --delete "${EXCLUDES[@]}" "$BUILD/" "$HOST:$REMOTE_DIR/"
rsync -a --delete "$BUILD/dist/" "$HOST:$REMOTE_DIR/dist/"
rsync -a --delete "$BUILD/server-build/" "$HOST:$REMOTE_DIR/server-build/"

if [ "${SKIP_RESTART:-}" = 1 ]; then
  echo "==> Synced. Restart on $HOST to activate: sudo systemctl restart visiongo-website"
  exit 0
fi

echo "==> Restarting visiongo-website (sudo on $HOST)"
ssh -t "$HOST" "cd $REMOTE_DIR && if ! cmp -s deploy/visiongo-website.service /etc/systemd/system/visiongo-website.service; then
  sudo install -m 644 deploy/visiongo-website.service /etc/systemd/system/visiongo-website.service && sudo systemctl daemon-reload; fi
sudo systemctl restart visiongo-website"

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if ssh "$HOST" "curl -fsS http://127.0.0.1:8600/api/health"; then echo; break; fi
  [ "$attempt" = 10 ] && { ssh "$HOST" "sudo journalctl -u visiongo-website -n 50 --no-pager"; exit 1; }
  sleep 1
done
ssh "$HOST" "sudo journalctl -u visiongo-website -n 5 --no-pager"
