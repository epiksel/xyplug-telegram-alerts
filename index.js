#!/usr/bin/env node
// xyOps Telegram Action Plugin
// Reads xyOps JSON from STDIN, sends a Telegram message, reports result via xyOps Wire Protocol.

const done = (code, description) => {
  const out = { xy: 1, code };
  if (description) out.description = description;
  console.log(JSON.stringify(out));
  process.exit(0);
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';

(async () => {
try {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const input = JSON.parse(chunks.join('') || '{}');
  const params = input.params || {};

  // Secret: bot token (from Secret Vault -> environment variable)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return done(1, 'Missing secret TELEGRAM_BOT_TOKEN (assign a Secret Vault to this plugin).');

  const chatId = params.chat_id || process.env.chat_id || process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return done(1, 'Missing Chat ID (set the "Chat ID" parameter or TELEGRAM_CHAT_ID secret).');

  if (truthy(params.debug)) console.error('INPUT: ' + JSON.stringify(input));

  const condition = input.condition || '';
  const alert = input.alert || {};
  const def = input.def || {};
  const job = input.job || {};
  const links = input.links || {};

  const cleared = condition === 'alert_cleared';
  const isAlert = condition.startsWith('alert') || !!input.alert;

  if (cleared && params.notify_on_clear !== undefined && !truthy(params.notify_on_clear)) {
    console.log('Skipped: "Notify when alert clears" is disabled.');
    return done(0, 'Skipped (notify_on_clear disabled)');
  }

  const emoji = cleared || condition === 'success' ? '✅' : (isAlert ? '🚨' : '❌');
  const status = cleared ? 'SOLVED' : (isAlert ? 'ALERT' : condition.toUpperCase());

  const title = def.title || alert.title || input.title || job.title || input.event_title || 'xyOps';
  const message = alert.message || input.message || job.description || input.description || '-';
  // Server display: "Label (hostname)" if the server label (Server.title) differs from hostname
  const server = (input.server && typeof input.server === 'object') ? input.server : {};
  const hostname = server.hostname || input.nice_hostname || '';
  const label = String(server.title || '').trim();
  const sameAsHost = !label || [hostname, input.nice_hostname]
    .filter(Boolean).some((h) => h.toLowerCase() === label.toLowerCase());
  const host = hostname
    ? (sameAsHost ? hostname : `${label} (${hostname})`)
    : (label || input.nice_server || '');

  const lines = [`${emoji} <b>${esc(status)}: ${esc(title)}</b>`, esc(message)];
  if (host) lines.push(`Server: <code>${esc(host)}</code>`);
  if (truthy(params.include_link ?? true)) {
    const url = links.alert_url || links.server_url;
    if (url) lines.push(`<a href="${esc(url)}">Open in xyOps Admin</a>`);
  }

  let text = lines.join('\n');
  if (text.length > 4000) text = text.slice(0, 3990) + '…';

  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    disable_notification: truthy(params.silent) || (cleared && truthy(params.silent_on_clear))
  };
  if (params.thread_id) body.message_thread_id = Number(params.thread_id);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return done(1, `Telegram API error: ${data.description || res.status}`);

  console.log('Telegram message sent (message_id ' + data.result?.message_id + ')');
  done(0);
} catch (err) {
  done(1, `Plugin error: ${err.message}`);
}
})();