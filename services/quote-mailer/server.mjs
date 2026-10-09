import http from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import nodemailer from 'nodemailer';
import { renderQuoteEmail, sampleQuote } from './template.mjs';
import { internationalPhone, validateQuoteFields } from '../../lib/quote-validation.mjs';

const inboxes = ['s.kishorebabu8@gmail.com', 'shivajiksgarments@gmail.com'];
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readQuote(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Please check your quote details.');
  const field = (name, max, required = false, multiline = false) => {
    if (value[name] !== undefined && typeof value[name] !== 'string') throw new Error('Please check your quote details.');
    const result = (value[name] || '').trim();
    if ((required && !result) || result.length > max || (!multiline && /[\r\n]/.test(result)) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) throw new Error('Please check your quote details.');
    return result;
  };
  const quote = { requestId: field('requestId', 36, true), email: field('email', 254, true), phone: field('phone', 30, true), country: field('country', 2) || 'IN', subject: field('subject', 160, true), message: field('message', 2000, true, true), product: field('product', 160), color: field('color', 60), size: field('size', 30), honey: field('honey', 200) };
  if (!uuidPattern.test(quote.requestId) || !emailPattern.test(quote.email)) throw new Error('Please enter a valid email and quote details.');
  const errors = validateQuoteFields(quote);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  quote.phone = internationalPhone(quote.phone, quote.country);
  return quote;
}

export function createQuoteServer({ env = process.env, transport } = {}) {
  const sender = (env.SMTP_USER || '').trim();
  const password = (env.SMTP_APP_PASSWORD || '').replace(/\s/g, '');
  const configured = Boolean(transport || (emailPattern.test(sender) && password));
  const mailer = transport || (configured ? nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: sender, pass: password }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, disableFileAccess: true, disableUrlAccess: true }) : null);
  const origins = new Set((env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(value => value.trim()).filter(Boolean));
  const records = new Map();
  const limits = new Map();

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method === 'GET' && url.pathname === '/preview' && env.NODE_ENV !== 'production') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(renderQuoteEmail(sampleQuote, { reference: 'SK-QUOTE-PREVIEW' }).html);
      return;
    }
    if (url.pathname !== '/api/quote') { response.writeHead(404); response.end(); return; }
    const origin = request.headers.origin;
    const json = (status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(body)); };
    if (typeof origin !== 'string' || !origins.has(origin)) { json(403, { success: false, message: 'Please submit your quote from the THE SK APPARELS website.' }); return; }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.writeHead(204); response.end(); return;
    }
    if (request.method !== 'POST') { response.setHeader('Allow', 'POST, OPTIONS'); json(405, { success: false }); return; }
    if (!request.headers['content-type']?.startsWith('application/json')) { json(415, { success: false, message: 'Please submit your quote using the form.' }); return; }
    const now = Date.now();
    for (const [key, value] of limits) if (value.until <= now) limits.delete(key);
    const address = env.TRUST_PROXY === 'true' ? String(request.headers['x-forwarded-for'] || request.socket.remoteAddress).split(',')[0].trim() : request.socket.remoteAddress;
    const limit = limits.get(address) || { count: 0, until: now + 60000 };
    if (limit.count >= 6 || limits.size >= 5000) { response.setHeader('Retry-After', '60'); json(429, { success: false, message: 'Please wait a minute before submitting another quote.' }); return; }
    limit.count++; limits.set(address, limit);

    let quote;
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > 16000) { json(413, { success: false, message: 'Your quote is too long. Please shorten the message.' }); request.resume(); return; }
        chunks.push(chunk);
      }
      quote = readQuote(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch {
      if (!response.writableEnded) json(400, { success: false, message: 'Please check your email, phone number and quote details.' });
      return;
    }
    if (quote.honey) { json(200, { success: true }); return; }
    if (!mailer) { json(503, { success: false, message: 'Quote email setup is not ready yet. Please call THE SK APPARELS.' }); return; }
    for (const [key, record] of records) if (!record.inFlight && record.createdAt.getTime() + 86400000 < now) records.delete(key);
    const fingerprint = createHash('sha256').update(JSON.stringify(quote)).digest('hex');
    let record = records.get(quote.requestId);
    if (record && record.fingerprint !== fingerprint) { json(409, { success: false, message: 'This request has changed. Please reopen the form and try again.' }); return; }
    if (!record) {
      if (records.size >= 1000) { json(503, { success: false, message: 'We’re busy receiving enquiries. Please try again shortly.' }); return; }
      record = { fingerprint, accepted: new Set(), createdAt: new Date(), inFlight: null };
      records.set(quote.requestId, record);
    }
    const reference = `SK-${quote.requestId.slice(0, 8).toUpperCase()}`;
    if (!record.inFlight && record.accepted.size < inboxes.length) {
      const pending = inboxes.filter(inbox => !record.accepted.has(inbox));
      const email = renderQuoteEmail(quote, { receivedAt: record.createdAt, reference });
      record.inFlight = Promise.resolve().then(() => mailer.sendMail({
        from: { name: 'THE SK APPARELS', address: sender }, to: pending, replyTo: quote.email,
        subject: `New quote · THE SK APPARELS | ${quote.subject}`, html: email.html, text: email.text,
        disableFileAccess: true, disableUrlAccess: true,
      })).then(info => {
        for (const accepted of info.accepted || []) if (inboxes.includes(String(accepted).toLowerCase())) record.accepted.add(String(accepted).toLowerCase());
      }).catch(error => {
        console.error('[quote-mailer] SMTP delivery failed:', error.code || 'SMTP_ERROR');
      }).finally(() => { record.inFlight = null; });
    }
    await record.inFlight;
    if (record.accepted.size !== inboxes.length) {
      json(502, { success: false, message: record.accepted.size ? 'Your quote reached THE SK APPARELS, but one copy could not be sent. Please retry to complete it.' : 'Your quote could not be sent. Please try again or call THE SK APPARELS.' });
      return;
    }
    json(200, { success: true, reference });
  });
  server.on('close', () => mailer?.close?.());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3031);
  const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  createQuoteServer().listen(port, host, () => console.log(`[quote-mailer] Listening on http://${host}:${port}${process.env.NODE_ENV === 'production' ? '' : ' · Preview: /preview'}`));
}
