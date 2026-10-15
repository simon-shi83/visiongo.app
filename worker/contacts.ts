import type { Env } from './types';
import { allowRequest, json, requireDatabase } from './reliability';

type Inquiry = { id: string; name: string; email: string; company: string; country: string; product: string; message: string; locale: string; source: string; notification_attempts: number };
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export async function receiveInquiry(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return json({ error: 'Request is too large.' }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Invalid form.' }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }
  // Bots receive an acknowledgement without creating a customer inquiry.
  if (text(body.websiteUrl)) return json({ success: true, referenceId: `VG-${crypto.randomUUID()}` });
  const inquiry = {
    name: text(body.name), email: text(body.email).toLowerCase(), company: text(body.company),
    country: text(body.country), product: text(body.product || body.productInterest) || 'all',
    message: text(body.message || body.projectScope), locale: body.locale === 'zh' ? 'zh' : 'en',
    source: text(body.source).slice(0, 300),
  };
  if (!inquiry.name || inquiry.name.length > 100 || inquiry.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email) || !inquiry.message || inquiry.message.length > 5000 ||
      inquiry.company.length > 200 || inquiry.country.length > 100 || inquiry.product.length > 100) {
    return json({ error: inquiry.locale === 'zh' ? '请填写有效的姓名、邮箱和项目描述（最多 5000 字）。' : 'Enter a valid name, email and project description (up to 5000 characters).' }, 400);
  }
  const submissionId = text(body.submissionId) || crypto.randomUUID();
  if (!/^[\w-]{16,80}$/.test(submissionId)) return json({ error: 'Invalid submission ID.' }, 400);
  try {
    const db = requireDatabase(env);
    if (!await allowRequest(env, 'contact', inquiry.email, 5, 3600)) return json({ error: 'Too many inquiries. Please try later.' }, 429);
    const id = `VG-${crypto.randomUUID()}`;
    await db.prepare(
      'INSERT INTO contact_inquiries (id, submission_id, name, email, company, country, product, message, locale, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(submission_id) DO NOTHING'
    ).bind(id, submissionId, inquiry.name, inquiry.email, inquiry.company, inquiry.country, inquiry.product, inquiry.message, inquiry.locale, inquiry.source, new Date().toISOString()).run();
    const saved = await db.prepare('SELECT id, email, message FROM contact_inquiries WHERE submission_id = ?').bind(submissionId).first<{ id: string; email: string; message: string }>();
    if (!saved) throw new Error('Inquiry was not persisted');
    if (saved.email !== inquiry.email || saved.message !== inquiry.message) return json({ error: 'Submission ID already used.' }, 409);
    ctx.waitUntil(dispatchInquiries(env).catch(() => console.error('[Contact] Notification dispatch unavailable')));
    return json({ success: true, referenceId: saved.id }, 201);
  } catch {
    console.error('[Contact] Inquiry storage unavailable');
    return json({ error: inquiry.locale === 'zh' ? '暂时无法保存咨询，请稍后重试或发送邮件至 contact@visiongo.app。' : 'Unable to save your inquiry. Please retry or email contact@visiongo.app.' }, 503);
  }
}

// A durable lease prevents simultaneous request/cron dispatchers sending twice.
// Resend's idempotency key also protects a retry after a successful send + D1 failure.
export async function dispatchInquiries(env: Env): Promise<void> {
  const db = requireDatabase(env);
  if (!env.RESEND_API_KEY) return;
  const now = Date.now();
  const pending = await db.prepare(
    "SELECT id FROM contact_inquiries WHERE notification_status = 'pending' AND next_attempt_at <= ? AND notification_attempts < 8 ORDER BY created_at LIMIT 20"
  ).bind(now).all<{ id: string }>();
  for (const item of pending.results) {
    const inquiry = await db.prepare(
      "UPDATE contact_inquiries SET notification_attempts = notification_attempts + 1, next_attempt_at = ? WHERE id = ? AND notification_status = 'pending' AND next_attempt_at <= ? AND notification_attempts < 8 RETURNING *"
    ).bind(now + 5 * 60 * 1000, item.id, now).first<Inquiry>();
    if (!inquiry) continue;
    let delivered = false;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': inquiry.id },
        body: JSON.stringify({
          from: 'VISIONGO <contact@visiongo.app>', to: [env.CONTACT_EMAIL_TO || 'contact@visiongo.app'], reply_to: inquiry.email,
          subject: `VISIONGO inquiry ${inquiry.id}`,
          text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nCompany: ${inquiry.company}\nCountry: ${inquiry.country}\nProduct: ${inquiry.product}\nSource: ${inquiry.source}\n\n${inquiry.message}`,
        }),
      });
      delivered = response.ok;
      await response.body?.cancel();
    } catch {
      console.error('[Contact] Notification attempt failed');
    }
    await db.prepare('UPDATE contact_inquiries SET notification_status = ?, next_attempt_at = ? WHERE id = ?').bind(
      delivered ? 'sent' : inquiry.notification_attempts >= 8 ? 'failed' : 'pending',
      Date.now() + Math.min(2 ** inquiry.notification_attempts, 60) * 60 * 1000, inquiry.id
    ).run();
  }
}
