# SK GARMENTS

An editorial, interactive fashion website built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Lucide. All ten content routes export as static files. No database, authentication, API routes, server actions, or payment processing are used.

## Run and export

- `npm install`
- `npm run dev`
- `npm run build` generates `out/`.
- Serve `out/` with any static host that supports directory index files. Keep the trailing-slash routes. No Node.js runtime is needed in production.

## Update the business

- `data/site.ts`: brand, contact links, homepage copy, policies, founder story, feature flags, optional team/reviews/statistics.
- `data/products.ts`: products, prices (INR or null), fit, fabric/GSM, colors, sizes, care, measurements, images, stock, collection membership.
- `data/collections.ts`: collection themes and descriptions.
- `data/faqs.ts`: FAQs.

Set `site.contact.whatsapp` to a real international number, or set `email` or `externalCheckout`. These enable external enquiry links. Until a contact is configured, visitors can prepare and copy an enquiry. No message is sent automatically. Instagram comes from the supplied brief.

The address and phone are supplied by the business owner: Door 17, Amarajyothi Nagar, Samundipuram, Tiruppur, Tamil Nadu 641603; +91 88921 28864. The location section and map directions are enabled. The shared listing status does not establish a full weekly schedule, so visitors are asked to call for current opening hours. WhatsApp is not assumed from a phone number.

Prices, measurements, GSM, fabric claims, stock, exact weekly hours, team, testimonials, and community figures are deliberately unset. Team/reviews/statistics sections are disabled. Enable them only with verified information. The About text is the brief's brand positioning; no founder or history has been fabricated.

Add prices and stock only when confirmed. Structured product offers are included only when prices exist; ratings are never fabricated. Canonical, Open Graph, social text, Organization, Product, and Breadcrumb data are included. Set `site.origin` when changing domains. A sitemap and robots file are generated during export. Internal page navigation uses native anchors and CSS page-entry transitions, so static hosting needs no framework request rewrites.

## Photography and concepts

Original built-in imagegen assets are stored in `public/images/`; the prompts and production notes are in `ASSETS.md`. They are concept mockups, not photographs of actual SK merchandise. CSS tinting illustrates colorways. After Dark typography and the recurring SK thread are original code-native concepts.

To replace the mockup, put real photos in `public/images/` and change each product's `frontImage`, `backImage`, and `images`. Separate front/back paths render real photos with no tint or mockup artwork. Replace `campaign.webp` and `fabric.webp` when real brand photos exist. The campaign image is a five-column contact sheet; individual campaign-1.webp through campaign-5.webp crops provide natural responsive framing.

Each product can have its own size chart in `measurements`: `{ S: { chest: 50, length: 68, shoulder: 45, sleeve: 21 }, ... }`. Values are flat garment dimensions in centimeters. The example is a schema illustration, not a published size recommendation.

## Interaction and accessibility

Floating cursor-reactive hero; scroll-reactive marquee; product index; expanding product comparison; front/back slider; fit morph; sticky FIT/FABRIC/DETAIL/ATTITUDE story; rotating graphic tee; fabric zoom; color environment switching; horizontal lookbook; animated thread; magnetic buttons; frontend bag; product/bulk enquiry draft; animated FAQ.

The bag uses device-local `localStorage` only. Dialogs trap focus, restore focus, and close with Escape. Buttons have labels and visible focus rings. Mobile replaces desktop hover with tap and horizontal scroll with touch swiping. Reduced-motion preference removes major scroll, cursor, and rotation effects while keeping content usable. GSAP is omitted because Framer Motion handles the required effects without a second animation runtime.

## Publish

`.openai/hosting.json` identifies the private Sites project and its `out` static directory. Keep this identity when updating this site. Deployment uses the Sites plugin workflow; access is owner-private until explicitly changed.