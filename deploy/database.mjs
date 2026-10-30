import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

export function createDatabase(filename, migrations) {
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  sqlite.exec('CREATE TABLE IF NOT EXISTS deployment_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
  for (const name of readdirSync(migrations).filter(n => n.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(migrations, name), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = sqlite.prepare('SELECT checksum FROM deployment_migrations WHERE name=?').get(name);
    if (previous) {
      if (previous.checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      sqlite.exec(sql);
      sqlite.prepare('INSERT INTO deployment_migrations VALUES (?, ?, ?)').run(name, checksum, new Date().toISOString());
      sqlite.exec('COMMIT');
    } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }
  function prepare(sql) {
    let parameters = [];
    const execute = () => {
      const statement = sqlite.prepare(sql);
      if (statement.columns().length) return { success: true, results: statement.all(...parameters), meta: {} };
      const result = statement.run(...parameters);
      return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    };
    const api = {
      bind(...values) { return prepare(sql).setParameters(values); },
      setParameters(values) { parameters = values; return api; },
      async first(column) { const row = sqlite.prepare(sql).get(...parameters); return row ? (column ? row[column] : row) : null; },
      async all() { return execute(); },
      async run() { return execute(); },
      execute,
    };
    return api;
  }
  return {
    prepare,
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const results = statements.map(s => s.execute()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); },
  };
}
