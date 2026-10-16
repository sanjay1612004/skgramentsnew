import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useStoreCart } from '../components/exclusive-store/use-store-cart';

const empty = {
  items: [],
  summary: {
    itemCount: 0,
    subtotal: 0,
    currency: null,
    discountTotal: 0,
    checkoutEligible: false,
    issueCount: 0,
  },
};
const updated = { ...empty, summary: { ...empty.summary, itemCount: 2 } };
const json = (cart: unknown) =>
  new Response(JSON.stringify({ cart }), {
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() =>
  vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', 'http://localhost:1234'),
);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('ignores an older cart read after adding a product', async () => {
  let finish: (value: Response) => void = () => {};
  const fetch = vi.fn((url: string) =>
    url.endsWith('/cart')
      ? new Promise<Response>((resolve) => {
          finish = resolve;
        })
      : Promise.resolve(json(updated)),
  );
  vi.stubGlobal('fetch', fetch);
  const expired = vi.fn();
  const hook = renderHook(() => useStoreCart('first-customer', expired));
  await act(async () => {
    await hook.result.current.addItem('variant');
  });
  expect(hook.result.current.cart?.summary.itemCount).toBe(2);
  await act(async () => finish(json(empty)));
  expect(hook.result.current.cart?.summary.itemCount).toBe(2);
});

it('clears the previous customer bag while loading another account', async () => {
  let finish: (value: Response) => void = () => {};
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(json(updated))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetch);
  const expired = vi.fn();
  const hook = renderHook(({ id }) => useStoreCart(id, expired), {
    initialProps: { id: 'first-customer' },
  });
  await waitFor(() =>
    expect(hook.result.current.cart?.summary.itemCount).toBe(2),
  );
  hook.rerender({ id: 'second-customer' });
  expect(hook.result.current.cart).toBeNull();
  expect(hook.result.current.loading).toBe(true);
  await act(async () => finish(json(empty)));
  expect(hook.result.current.cart?.summary.itemCount).toBe(0);
});
