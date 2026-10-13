import { afterEach, expect, it, vi } from 'vitest';
import { storeRequest, storeApiBase, StoreApiError, stockAvailability, type Variant } from '../lib/store-api';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('does not send requests to a fallback localhost API in a production build', () => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', '');
  expect(storeApiBase).toThrow(StoreApiError);
});
it('always sends cookies and avoids caching private responses', async () => {
  vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', 'https://api.theskapparel.com/');
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] })));
  vi.stubGlobal('fetch', fetch);
  await storeRequest('/exclusive-store/categories');
  expect(fetch).toHaveBeenCalledWith('https://api.theskapparel.com/exclusive-store/categories', expect.objectContaining({ credentials: 'include', cache: 'no-store' }));
});

function variant(inventory: Variant['inventory'], status = 'active'): Variant {
  return { _id: 'variant', sku: 'TEST-M', status, pricing: { price: 10000, currency: 'INR' }, inventory };
}
it('counts sellable stock across active options after subtracting reservations', () => {
  expect(stockAvailability([
    variant({ trackQuantity: true, quantity: 5, reserved: 2 }),
    variant({ trackQuantity: true, quantity: 2, reserved: 0 }),
    variant({ trackQuantity: true, quantity: 10 }, 'inactive'),
    variant({ trackQuantity: true, quantity: 1, reserved: 3 }),
  ])).toEqual({ label: '5 in stock', available: true });
});
it('distinguishes sold out, backorders and untracked inventory without inventing stock counts', () => {
  expect(stockAvailability([])).toEqual({ label: 'Sold out', available: false });
  expect(stockAvailability([variant({ trackQuantity: true, quantity: 0 })])).toEqual({ label: 'Sold out', available: false });
  expect(stockAvailability([variant({ trackQuantity: true, quantity: 0, allowBackorder: true })])).toEqual({ label: 'Available on backorder', available: true });
  expect(stockAvailability([variant({ trackQuantity: false, quantity: 0 })])).toEqual({ label: 'In stock', available: true });
});
