import { mkdir, writeFile } from 'node:fs/promises';
import { renderQuoteEmail, sampleQuote } from '../services/quote-mailer/template.mjs';

await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
const target = new URL('../artifacts/quote-email-preview.html', import.meta.url);
await writeFile(target, renderQuoteEmail(sampleQuote, { reference: 'SK-QUOTE-PREVIEW' }).html);
console.log(`Email preview saved to ${target.pathname}`);
