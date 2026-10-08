# THE SK APPARELS branded quote email

This Node service sends the custom HTML and plain-text email through Gmail SMTP to **both** `s.kishorebabu8@gmail.com` and `shivajiksgarments@gmail.com`. The sender displays as **THE SK APPARELS**, and Reply-To points to the customer. The email includes a reference, an India-time timestamp, contact details, the message, selected garment details when supplied, and reply/call actions. It does not include a source URL or FormSubmit branding.

## Enable locally

1. Choose the Gmail account that will send the email. Enable [Google two-step verification and create an App Password](https://support.google.com/accounts/answer/185833). A normal Gmail password will not work. Some managed or restricted Google accounts do not offer App Passwords.
2. Copy `services/quote-mailer/.env.example` to `services/quote-mailer/.env`. Set `SMTP_USER` to that Gmail address and `SMTP_APP_PASSWORD` to its App Password. Keep the secret in this ignored file; do not put it in frontend variables or chat.
3. Run `npm run email:verify` to check the Gmail connection without sending anything, then run `npm run email:dev`. View the design at **http://127.0.0.1:3031/preview**; previewing does not send anything.
4. In the website's `.env.local`, set `NEXT_PUBLIC_QUOTE_API_URL=http://127.0.0.1:3031/api/quote`, then restart `npm run dev`.
5. Submit a quote and verify both inboxes receive the email. Check Spam as well. The service's SMTP acceptance confirms submission, not final inbox placement.

Leave `NEXT_PUBLIC_QUOTE_API_URL` unset until Gmail is configured. The current working FormSubmit flow stays active while it is unset. When the custom endpoint is enabled, a sender failure is shown rather than silently switching providers.

## Preview and checks

`npm run email:preview` creates `artifacts/quote-email-preview.html` with example customer details. `npm run email:test` uses a mock mail transport: it never sends real email. The layout uses inline styles, table-based sections, system fonts, a mobile media query, and no external image dependencies. Visual browser checks are not a substitute for a real Gmail/Outlook inbox check.

## Production

Host this Node service on a Node-capable server with HTTPS. Set `NODE_ENV=production`, the platform's `PORT`, `HOST=0.0.0.0`, `SMTP_USER`, `SMTP_APP_PASSWORD`, and `ALLOWED_ORIGINS` to the website's exact origin. Set `NEXT_PUBLIC_QUOTE_API_URL` to its HTTPS `/api/quote` URL and rebuild the website. This separate service is required because the website uses static export; it cannot run an SMTP sender itself. The preview route is disabled in production. Never expose SMTP credentials in `NEXT_PUBLIC_*` variables.

Both recipients are fixed on the server; clients cannot redirect quotes to arbitrary inboxes. The API validates input, rejects other browser origins, limits requests, escapes HTML, and preserves accepted recipients on retry. Retry tracking is held in memory for up to 24 hours and does not survive a restart or coordinate multiple server instances. It is a best-effort duplicate safeguard; SMTP timeouts after acceptance can still cause duplicates. `TRUST_PROXY=true` is only appropriate behind a trusted proxy that replaces the client IP header.
