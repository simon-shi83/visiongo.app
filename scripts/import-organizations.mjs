// Imports the enterprise organizations and members exported from VisionCloud
// (python -m app.database.export_organizations) into the website database.
//
//   node scripts/import-organizations.mjs organizations.json              # preview only
//   node scripts/import-organizations.mjs organizations.json --sql out.sql
//   npx wrangler d1 execute <database> --remote --file out.sql            # applied by an operator
//
// Organization IDs are kept so VisionCloud Credits stay attached. Members are
// imported as invitations; each one becomes active when that person next
// signs in with the same verified email. Existing rows are never overwritten.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID = /^[A-Za-z0-9_-]{1,128}$/;

function quote(value) {
  return value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`;
}

/** Validates the export and returns { sql, summary }. Throws on malformed input. */
export function buildImportSql(data, now = new Date().toISOString()) {
  const organizations = Array.isArray(data?.organizations) ? data.organizations : [];
  const members = Array.isArray(data?.members) ? data.members : [];
  const ids = new Set();
  const statements = [];
  for (const org of organizations) {
    if (!ID.test(org.id ?? '') || org.id.startsWith('vg_tenant_') || !String(org.name ?? '').trim()) {
      throw new Error(`invalid organization: ${JSON.stringify(org)}`);
    }
    const status = org.status === 'suspended' ? 'suspended' : 'active';
    ids.add(org.id);
    statements.push(
      `INSERT OR IGNORE INTO organizations (id, name, type, status, created_by, created_at) VALUES (${quote(org.id)}, ${quote(String(org.name).trim())}, 'enterprise', ${quote(status)}, NULL, ${quote(now)});`,
      `INSERT INTO organization_events (id, org_id, actor_user_id, action, target_email, detail, created_at) VALUES (${quote(`evt_import_${org.id}`)}, ${quote(org.id)}, NULL, 'organization.imported', NULL, 'VisionCloud', ${quote(now)}) ON CONFLICT(id) DO NOTHING;`);
  }
  let admins = 0;
  for (const member of members) {
    const email = String(member.email ?? '').trim().toLowerCase();
    if (!ids.has(member.org_id) || !EMAIL.test(email) || !['admin', 'member'].includes(member.role)) {
      throw new Error(`invalid member: ${JSON.stringify(member)}`);
    }
    if (member.role === 'admin') admins += 1;
    statements.push(
      `INSERT OR IGNORE INTO organization_members (org_id, email, user_id, role, status, invited_by, created_at, joined_at, updated_at) VALUES (${quote(member.org_id)}, ${quote(email)}, NULL, ${quote(member.role)}, 'invited', NULL, ${quote(now)}, NULL, ${quote(now)});`);
  }
  const withoutAdmin = Array.isArray(data?.admins_without_email) ? data.admins_without_email : [];
  return {
    sql: statements.join('\n') + '\n',
    summary: { organizations: organizations.length, members: members.length, admins, withoutAdmin },
  };
}

function main(argv) {
  const [input, flag, output] = argv;
  if (!input || (flag && (flag !== '--sql' || !output))) {
    console.error('usage: node scripts/import-organizations.mjs <export.json> [--sql <out.sql>]');
    return 2;
  }
  const { sql, summary } = buildImportSql(JSON.parse(fs.readFileSync(input, 'utf8')));
  console.log(`organizations: ${summary.organizations}`);
  console.log(`members (imported as invitations): ${summary.members}, administrators: ${summary.admins}`);
  if (summary.withoutAdmin.length) {
    console.log('organizations whose administrator has no email (invite one after import):');
    for (const org of summary.withoutAdmin) console.log(`  ${org.org_id}  ${org.name}  (${org.admin_username || 'no username'})`);
  }
  if (flag === '--sql') {
    fs.writeFileSync(output, sql);
    console.log(`SQL written to ${output}; nothing has been applied.`);
  } else {
    console.log('preview only; pass --sql <file> to write the SQL.');
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.exitCode = main(process.argv.slice(2));
