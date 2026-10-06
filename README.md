# SK GARMENTS

An editorial, interactive fashion website built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Lucide. Content routes export as static files. No database, authentication, API routes, server actions, or payment processing are used.

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

Set `site.contact.whatsapp` to the business number (10-digit Indian numbers receive the +91 country code automatically), or update `email` for business enquiries. Product and bulk enquiries open the Get a Quote modal. Instagram comes from the supplied brief.

The Get a Quote modal sends directly from the website through FormSubmit’s AJAX endpoint to `site.contact.email` (currently `s.kishorebabu8@gmail.com`). The first submission triggers an activation email: the inbox owner must click **Activate Form** before quote delivery works. If activation is pending, the form shows an error and preserves the entered details for retry. Submit a quote again after activation and verify it arrives in the inbox. Browser tests intercept the endpoint and do not send real emails. No email app opens. Visitors see sending, confirmation, and recoverable failure states in the modal. FormSubmit is an external service; see [its setup documentation](https://formsubmit.co/).

Quote submissions include email, an optional phone number, the request subject, selected product/color/size when available, and the message. The owner email uses FormSubmit's table template with clear field labels and a “New quote request” subject. The explicit source URL field is omitted, and Reply-To remains the customer's email address.

The address and phone are supplied by the business owner: Door 17, Amarajyothi Nagar, Samundipuram, Tiruppur, Tamil Nadu 641603; the current configured phone and WhatsApp number is +91 93448 56330. The location section and map directions are enabled. The shared listing status does not establish a full weekly schedule, so visitors are asked to call for current opening hours. WhatsApp is not assumed from a phone number.

Prices, measurements, GSM, fabric claims, stock, exact weekly hours, team, testimonials, and community figures are deliberately unset. Team/reviews/statistics sections are disabled. Enable them only with verified information. The About section uses the owner-supplied shop photos and confirmed facts: established in 2016, based in Tiruppur, and 200+ orders handled. Its milestone values and workshop copy are in `site.about`; no founder or additional business figures have been invented.

Add prices and stock only when confirmed. Structured product offers are included only when prices exist; ratings are never fabricated. Canonical, Open Graph, social text, ClothingStore, WebSite, Service, Product, and Breadcrumb data are included. A sitemap and robots file are generated during export. Internal page navigation uses native anchors and CSS page-entry transitions, so static hosting needs no framework request rewrites.

## Search visibility for bulk and wholesale orders

The homepage and `/bulk-tshirt-orders/` describe bulk T-shirt orders, wholesale garment enquiries, and screen printing, embroidery and DTF printing in Tiruppur. The dedicated page contains ordering guidance, confirmed business facts and FAQs. Its content and all FAQ answers are included in the exported HTML. Navigation, footer, product and collection links lead buyers and crawlers to this page. Each route has its own canonical URL, title and description. No minimum quantity, price, turnaround time, delivery coverage or review rating is invented. FAQ content is provided for visitors; no Google FAQ rich-result eligibility is claimed.

Before expecting search traffic:

1. Make the production site publicly accessible. The existing Sites project was restricted to the owner when this SEO work started; `robots.txt` and metadata cannot bypass a login or an access restriction.
2. Set `NEXT_PUBLIC_SITE_URL` to the actual production domain (see `.env.example`) before building. This controls canonical URLs, the sitemap and structured-data URLs. The current Sites domain remains the default.
3. Verify the public site in Google Search Console. Use domain/DNS verification for a domain you own, or place the URL-prefix HTML verification token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and rebuild. Then submit `/sitemap.xml` and inspect the homepage and `/bulk-tshirt-orders/`.
4. Link the public website from the correct Google Business Profile and keep the business name, address and phone consistent. Add real customer reviews and confirmed order specifications when available.
5. Use Search Console to monitor impressions, queries and indexing after publication. A technical SEO audit measures implementation, not Google position; rankings and search traffic are not guaranteed.

## Photography and concepts

Original built-in imagegen assets are stored in `public/images/`; the prompts and production notes are in `ASSETS.md`. They are concept mockups, not photographs of actual SK merchandise. CSS tinting illustrates colorways. After Dark typography and the recurring SK thread are original code-native concepts.

To replace the mockup, put real photos in `public/images/` and change each product's `frontImage`, `backImage`, and `images`. Separate front/back paths render real photos with no tint or mockup artwork. Replace `campaign.webp` and `fabric.webp` when real brand photos exist. The campaign image is a five-column contact sheet; individual campaign-1.webp through campaign-5.webp crops provide natural responsive framing.

Each product can have its own size chart in `measurements`: `{ S: { chest: 50, length: 68, shoulder: 45, sleeve: 21 }, ... }`. Values are flat garment dimensions in centimeters. The example is a schema illustration, not a published size recommendation.

## Interaction and accessibility

Floating cursor-reactive hero; scroll-reactive marquee; product index; expanding product comparison; front/back slider; fit morph; sticky FIT/FABRIC/DETAIL/ATTITUDE story; Print & Stitch Studio with animated equipment tabs; 3D hoodie; fabric zoom; scroll-driven T-shirt making illustrations; animated thread; magnetic buttons; quote modal; animated FAQ; full-width store visit section with a Google Map for the configured address. The floating WhatsApp shortcut and footer link open a prefilled enquiry to the configured business number.

The studio showcases the user-supplied screen printing, embroidery, and DTF equipment images with lightweight entrance, hover, and fade animations. Keyboard-accessible tabs keep the selected service linked to its quote. Responsive WebP images use smaller mobile copies, and reduced motion disables the transitions. The neighboring hoodie model loads only when visible.

The About section presents the original `public/images/shop/shop1.webp` and `shop2.webp` photographs in a staggered gallery, with subtle parallax, heading reveals, and milestone entrances. Reduced motion keeps the photos and all business information visible without those effects.

The making section replaces the colour showcase with the user-supplied Cutting, Stitching, Ironing, Packing, and Dispatch illustrations. Its five dots indicate scroll progress rather than act as colour selectors. One sticky viewport follows scroll position with small transform and opacity transitions; WebP assets preserve the original artwork and transparency. Reduced motion displays all five stages in a normal list.

Dialogs trap focus, restore focus, and close with Escape. The native quote dialog uses GSAP for the card, brand panel, text, and form entrance, plus its success and closing animations. Buttons have labels and visible focus rings. Mobile replaces desktop hover with tap and horizontal scroll with touch swiping. Reduced-motion preference removes major scroll, cursor, rotation, and quote animation effects while keeping content usable.

## Publish

`.openai/hosting.json` identifies the private Sites project and its `out` static directory. Keep this identity when updating this site. Deployment uses the Sites plugin workflow; access is owner-private until explicitly changed.
