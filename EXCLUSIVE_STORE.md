# Shared exclusive store

The static `/exclusive-store/` page uses ApparelStore's existing `store-api`. The earlier
`/secret-store/` and `/secrete-store/` links redirect to `/exclusive-store/`, preserving query parameters.
No private catalog data or login tokens are included in the exported HTML.

## Local development

1. Start `store-api` on port 1234 with `npm run dev` in `../store-api`.
2. Run `npm run dev` here and visit `http://localhost:3000/exclusive-store/`.
3. Sign in using an existing store customer account. SK Apparel has no registration option.
4. Select a collection, select a product, choose a variant and add it to the shared bag.

The API accepts both localhost:5173 and localhost:3000 in development. Use **localhost**
for both frontends and the API to share the same cookie; 127.0.0.1 is a different host.
To use another port, add its full origin to store-api's CLIENT_ORIGINS.

Mark products **Exclusive store only** in the admin app, assign categories, add variants,
and publish. Only active exclusive products appear. The two frontends use the same customer
records and cart; refresh the bag to pick up changes made on the other frontend.

Category images are managed in **Admin → Categories → Import category image**. Choose a
JPEG, PNG, WebP or AVIF up to 5 MB, then save the category. The exclusive store displays
these images as compact round category cards. Uploaded files are served by admin-api;
keep its upload storage available and configure PUBLIC_BASE_URL for its production URL.

## Production

Deploy the shared API once and expose it using a same-site HTTPS hostname, for example
`https://api.theskapparel.com`. The hostname still requires DNS, TLS and hosting setup.
Both frontends should call this exact API hostname so they use the same API-host cookie.
The suggested storefront hostname is `https://store.theskapparel.com`.

Set this before building or deploying the SK frontend:

```
NEXT_PUBLIC_STORE_API_URL=https://api.theskapparel.com
```

Set these on the shared API deployment:

```
NODE_ENV=production
CLIENT_ORIGIN=https://store.theskapparel.com
CLIENT_ORIGINS=https://www.theskapparel.com,https://theskapparel.com
```

Keep the API's existing MONGODB_URI and JWT_SECRET in its server environment. Never put
them in NEXT_PUBLIC variables. If store-ui is deployed on another hostname, include its
exact origin and assess the cookie arrangement before deployment. An unrelated domain
can encounter third-party-cookie blocking; adding CORS permission alone doesn't solve it.

Next.js public environment variables are embedded at build time. Rebuild when the API
URL changes. `npm run build` still produces `out/` for the existing static host. This
implementation does not deploy changes to the live Vercel project or configure DNS.

## Behavior and checks

The page checks `/profile` before requesting private catalog data and on window focus.
The exclusive-store navbar contains only the shop logo, shopping bag and customer avatar.
Login opens in a modal. The avatar opens a compact floating panel beside the profile picture, with profile
editing and sign-out using the shared API. Successful sign-out closes profile actions
and navigates to the SK Apparel home page (`/`). In-page back/collection buttons are
omitted; use the browser's navigation controls. The login modal supports Escape, focus trapping,
backdrop close and focus restoration. Profile actions close on Escape, outside clicks or
when keyboard focus leaves the panel.
Login confirms that the browser accepted the HttpOnly cookie. Private requests send
credentials, bypass caching and return to the login form on a 401 response. The backend
independently checks an active customer role on every exclusive-store route. Untrusted
browser origins cannot perform writes. Customer passwords and tokens aren't persisted
in localStorage or placed in URLs.

Category/product/page query parameters keep deep links and back navigation compatible
with static export, without generating private products during the build. The page is
marked noindex and uses the site's existing cream, forest-green and lime styling.

The shared bag supports adding variants, changing quantity and removing items. Shipping
and payment remain separate; no checkout or payment service is introduced.

Product cards show total sellable stock across active variants, after reservations.
Selecting a colour and size on the product page shows that option's stock and price.
Untracked inventory displays “In stock”; zero-stock backorders are labelled explicitly.
The mobile layout uses compact round categories, a two-column product grid, a contained
image gallery, and a fixed purchase bar above the device's bottom safe area.

Run `npm test`, `npx tsc --noEmit` and `npm run build`. Backend CORS, cookie and access
coverage lives in `../store-api/test/exclusiveStore.integration.test.js`.
