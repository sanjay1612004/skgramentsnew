import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createQuoteServer } from './server.mjs';
import { renderQuoteEmail, sampleQuote } from './template.mjs';

const inboxes = ['s.kishorebabu8@gmail.com', 'shivajiksgarments@gmail.com'];
const quote = () => ({ ...sampleQuote, requestId: randomUUID(), honey: '' });
async function withServer(transport, work) {
  const server = createQuoteServer({ env: { SMTP_USER: 'owner@example.com', ALLOWED_ORIGINS: 'http://localhost:3000', NODE_ENV: 'production' }, transport });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/api/quote`;
  const submit = (data, origin = 'http://localhost:3000') => fetch(endpoint, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  try { await work(submit, endpoint); } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('email escapes customer content, preserves line breaks, and omits source and absent phone actions', () => {
  const { html, text } = renderQuoteEmail({ ...sampleQuote, phone: '', message: '<script>alert("test")</script>\nSecond line', subject: '<img src=x onerror=alert(1)>' });
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<br>Second line'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('tel:'));
  assert.ok(!html.includes('localhost') && !html.includes('FormSubmit'));
  assert.ok(html.includes('mailto:customer%40example.com'));
  assert.ok(text.includes('Not provided'));
});

test('SMTP message contains both recipients, customer Reply-To and HTML/plain-text alternatives', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const email = renderQuoteEmail(sampleQuote);
  const info = await transport.sendMail({ from: { name: 'SK GARMENTS', address: 'owner@example.com' }, to: inboxes, replyTo: sampleQuote.email, subject: 'SK GARMENTS quote', ...email });
  assert.deepEqual(info.envelope.to, inboxes);
  const mime = info.message.toString();
  assert.match(mime, /Reply-To: customer@example.com/);
  assert.match(mime, /Content-Type: text\/plain/);
  assert.match(mime, /Content-Type: text\/html/);
  assert.match(mime, /From: SK GARMENTS <owner@example.com>/);
});

test('one branded email targets both fixed inboxes with customer Reply-To; identical retry does not resend', async () => {
  const sent = [];
  await withServer({ sendMail: async mail => { sent.push(mail); return { accepted: inboxes }; } }, async submit => {
    const data = { ...quote(), to: ['unwanted@example.com'] };
    assert.equal((await submit(data)).status, 200);
    assert.equal((await submit(data)).status, 200);
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, inboxes);
    assert.equal(sent[0].from.name, 'SK GARMENTS');
    assert.equal(sent[0].replyTo, sampleQuote.email);
    assert.ok(sent[0].html.includes('Reply to customer') && sent[0].text.includes(sampleQuote.message));
    assert.equal((await submit({ ...data, message: 'Changed request' })).status, 409);
    assert.equal(sent.length, 1);
  });
});

test('partial SMTP acceptance reports failure and retry sends only the missing copy', async () => {
  const sent = [];
  await withServer({ sendMail: async mail => { sent.push(mail); return { accepted: [sent.length === 1 ? inboxes[0] : inboxes[1]] }; } }, async submit => {
    const data = quote();
    const first = await submit(data);
    assert.equal(first.status, 502);
    assert.equal((await first.json()).success, false);
    assert.equal((await submit(data)).status, 200);
    assert.deepEqual(sent[1].to, [inboxes[1]]);
  });
});

test('invalid input, untrusted origin and honeypot never send email', async () => {
  const sent = [];
  await withServer({ sendMail: async mail => { sent.push(mail); return { accepted: inboxes }; } }, async submit => {
    assert.equal((await submit(quote(), 'https://untrusted.example')).status, 403);
    assert.equal((await submit({ ...quote(), email: 'wrong' })).status, 400);
    assert.equal((await submit({ ...quote(), subject: 'Quote\r\nBcc: injected@example.com' })).status, 400);
    assert.equal((await submit({ ...quote(), message: 'x'.repeat(2001) })).status, 400);
    assert.equal((await submit({ ...quote(), honey: 'bot' })).status, 200);
    assert.equal(sent.length, 0);
  });
});

test('missing credentials cannot report success, and repeated requests are limited', async () => {
  await withServer(undefined, async submit => {
    const result = await submit(quote());
    assert.equal(result.status, 503);
    assert.equal((await result.json()).success, false);
    for (let i = 0; i < 5; i++) await submit(quote());
    assert.equal((await submit(quote())).status, 429);
  });
});
