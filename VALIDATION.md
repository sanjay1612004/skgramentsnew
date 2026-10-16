# Validation

## Exclusive Store cart and COD checkout — 15 October 2026

- 38 frontend tests pass, including cart quantities/removal, stock limits, account isolation, stale-response protection, delivery address saving, COD order submission and retry with the same request ID, profile-menu order history, history retry/pagination, immediate orange-dot updates after adding items and confirmed customer cancellation.
- TypeScript check and production static export pass. The frontend remains statically hosted; orders are stored by the shared API.
- ESLint passes for the changed Exclusive Store components, API types and tests. Full-repository lint still reports four existing `no-html-link-for-pages` errors in `app/bulk-tshirt-orders/page.tsx` and five unrelated warnings.
- Backend regression suite: 43 passed, one Elasticsearch integration test skipped because its external test service was not configured. Checkout tests use a disposable MongoDB replica set, including duplicate submissions, final-unit races, stale prices, address ownership, stock reservations, customer-only order history and exactly-once cancellation stock restoration.
- Checkout uses cash on delivery and ₹60 shipping within India. Online payment is deferred by request.
- No live orders were placed, no production stock was changed, and no deployment was performed. Browser visual inspection was unavailable because no browser was connected. Check bag, address form, review and confirmation at 320px, 390px and desktop widths before release.

## Earlier site validation

Production static export and TypeScript checks passed. Ten content routes, sitemap, robots, canonical metadata, and resource requests were checked using the exported files.

Browser checks covered 1440px desktop, 390px mobile, and 320px narrow mobile; no horizontal overflow or browser JavaScript errors were found. Product color and size, bag quantities and persistence, Escape dismissal, front/back switching, product and bulk enquiry drafts, FAQ, fit and color controls, and mobile navigation passed. The horizontal lookbook ends with its final image visible. Reduced-motion mode exposes all four brand principles without sticky storytelling.

Original garment, campaign, and texture assets are optimized WebP, with alpha preserved on the garment atlas. Desktop, mobile, and major sections were captured for local visual review. Screenshots and temporary browser-check tools are under ignored work/ and are excluded from publication.

Business prices, technical fabric specifications, exact measurements, and ordering contacts are intentionally unset; reviews, community statistics, team, sections remain hidden. The supplied Tiruppur location, click-to-call phone, map directions, and hours clarification are displayed. Enquiries can be prepared and copied but are not sent until a real contact is configured.

Core Web Vitals have not been field-measured.
