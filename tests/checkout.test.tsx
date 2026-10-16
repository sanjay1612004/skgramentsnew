import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import ExclusiveStore from '../components/exclusive-store/exclusive-store';

let query = 'bag=1';
const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock('next/link', () => ({
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));
const address = {
  _id: 'address',
  recipientName: 'Test Customer',
  phone: '+919876543210',
  addressLine1: '12 Test Street',
  city: 'Tiruppur',
  state: 'Tamil Nadu',
  postalCode: '641603',
  countryCode: 'IN',
  isDefaultShipping: true,
};
const customer = {
  _id: 'customer',
  firstName: 'Test',
  lastName: 'Customer',
  emailId: 'test@example.com',
  roles: ['customer'],
  addresses: [address],
};
const item = {
  variantId: 'variant',
  quantity: 1,
  unitPrice: 99900,
  lineTotal: 99900,
  currency: 'INR',
  available: true,
  maxQuantity: 3,
  product: { name: 'Floral shirt', slug: 'floral-shirt', isSecret: true },
  variant: { sku: 'SHIRT-M', options: { color: { name: 'Black' }, size: 'M' } },
};
const cart = {
  items: [item],
  summary: {
    itemCount: 1,
    subtotal: 99900,
    currency: 'INR',
    checkoutEligible: true,
    issueCount: 0,
    discountTotal: 0,
  },
};
const emptyCart = {
  items: [],
  summary: {
    ...cart.summary,
    itemCount: 0,
    subtotal: 0,
    currency: null,
    checkoutEligible: false,
  },
};
const quote = {
  cart,
  quoteToken: 'a'.repeat(64),
  currency: 'INR',
  shipping: 6000,
  total: 105900,
  countryCode: 'IN',
  paymentMethods: ['cod'],
};
const order = {
  _id: 'order-id',
  number: 'SK-TEST123',
  status: 'confirmed',
  paymentMethod: 'cod',
  paymentStatus: 'unpaid',
  shippingAddress: address,
  items: [],
  subtotal: 99900,
  shipping: 6000,
  total: 105900,
  currency: 'INR',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
function mockApi(
  handler?: (
    url: string,
    options: RequestInit,
  ) => Response | Promise<Response> | undefined,
) {
  const fetch = vi.fn(async (url: string, options: RequestInit) => {
    const custom = handler?.(url, options);
    if (custom) return custom;
    if (url.endsWith('/profile')) return json(customer);
    if (url.endsWith('/cart')) return json({ cart });
    if (url.endsWith('/checkout')) return json(quote);
    throw new Error('Unexpected request ' + url);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
beforeEach(() => {
  query = 'bag=1';
  replace.mockReset();
  vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', 'http://localhost:1234');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('loads the server bag with an orange-dot indicator and checkout link', async () => {
  mockApi();
  render(<ExclusiveStore />);
  expect(
    await screen.findByRole('heading', { name: 'Your bag' }),
  ).toBeInTheDocument();
  const shirt = await screen.findByRole('article', { name: 'Floral shirt' });
  expect(within(shirt).getByText('Black · M')).toBeInTheDocument();
  expect(screen.getByLabelText('1 item in bag')).toHaveClass('ss-bag-dot');
  expect(screen.getByLabelText('1 item in bag')).toBeEmptyDOMElement();
  expect(
    screen.getByRole('link', { name: 'Continue to checkout' }),
  ).toHaveAttribute('href', '/exclusive-store/?checkout=1');
  expect(screen.queryByText('SAME ACCOUNT / SAME BAG')).not.toBeInTheDocument();
});

it('opens Your orders from the profile menu and links saved orders to their details', async () => {
  const saved = {
    ...order,
    createdAt: '2026-10-15T12:00:00.000Z',
    items: [{ name: 'Floral shirt', quantity: 2 }],
  };
  mockApi((url) =>
    url.includes('/orders?')
      ? json({ data: [saved], pagination: { page: 1, pages: 1, total: 1 } })
      : undefined,
  );
  const view = render(<ExclusiveStore />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Open profile menu' }),
  );
  const orders = screen.getByRole('link', { name: 'Your orders' });
  expect(orders).toHaveAttribute('href', '/exclusive-store/?orders=1');
  fireEvent.click(orders);
  expect(
    screen.queryByRole('dialog', { name: 'Your profile' }),
  ).not.toBeInTheDocument();
  query = 'orders=1';
  view.rerender(<ExclusiveStore />);
  const link = await screen.findByRole('link', {
    name: 'View order SK-TEST123',
  });
  expect(link).toHaveAttribute('href', '/exclusive-store/?order=order-id');
  expect(within(link).getByText('Floral shirt')).toBeInTheDocument();
  expect(within(link).getByText('confirmed')).toBeInTheDocument();
  expect(within(link).getByText(/2 items/)).toBeInTheDocument();
});

it('shows the orange dot immediately after adding a product to an empty bag', async () => {
  query = 'product=floral-shirt';
  mockApi((url, options) => {
    if (url.endsWith('/cart')) return json({ cart: emptyCart });
    if (url.endsWith('/cart/items') && options.method === 'POST')
      return json({ cart });
    if (url.includes('/exclusive-store/products/'))
      return json({
        _id: 'product',
        name: 'Floral shirt',
        slug: 'floral-shirt',
        shortDescription: '',
        description: '',
        images: [],
        variants: [
          {
            _id: 'variant',
            status: 'active',
            pricing: { price: 99900, currency: 'INR' },
            inventory: { trackQuantity: true, quantity: 3 },
            options: { color: { name: 'Black' }, size: 'M' },
          },
        ],
      });
  });
  render(<ExclusiveStore />);
  const add = await screen.findByRole('button', { name: 'Add to your bag' });
  expect(screen.queryByLabelText('1 item in bag')).not.toBeInTheDocument();
  fireEvent.click(add);
  expect(await screen.findByLabelText('1 item in bag')).toHaveClass(
    'ss-bag-dot',
  );
});

it('handles empty order history and retries a failed order-list request', async () => {
  query = 'orders=1';
  let attempts = 0;
  mockApi((url) => {
    if (url.includes('/orders?')) {
      attempts++;
      return attempts === 1
        ? json({ message: 'Could not load orders' }, 503)
        : json({ data: [], pagination: { page: 1, pages: 0, total: 0 } });
    }
  });
  render(<ExclusiveStore />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load orders',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByRole('heading', { name: 'No orders yet' }),
  ).toBeInTheDocument();
});

it('uses order page links without exposing another customer identifier', async () => {
  query = 'orders=1&page=2';
  const fetch = mockApi((url) =>
    url.includes('/orders?')
      ? json({ data: [], pagination: { page: 2, pages: 3, total: 22 } })
      : undefined,
  );
  render(<ExclusiveStore />);
  expect(await screen.findByRole('link', { name: 'Previous' })).toHaveAttribute(
    'href',
    '/exclusive-store/?orders=1&page=1',
  );
  expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
    'href',
    '/exclusive-store/?orders=1&page=3',
  );
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:1234/orders?page=2&limit=10',
    expect.objectContaining({ credentials: 'include' }),
  );
});

it('locks quantity controls while saving and updates prices and the header count from the server', async () => {
  let finish: (response: Response) => void = () => {};
  const fetch = mockApi((url, options) =>
    url.includes('/cart/items/') && options.method === 'PATCH'
      ? new Promise<Response>((resolve) => {
          finish = resolve;
        })
      : undefined,
  );
  render(<ExclusiveStore />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Increase quantity of Floral shirt',
    }),
  );
  expect(
    screen.getByRole('button', { name: 'Remove Floral shirt' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Continue to checkout' }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Increase quantity of Floral shirt' }),
  );
  const updated = {
    items: [{ ...item, quantity: 2, lineTotal: 199800 }],
    summary: { ...cart.summary, itemCount: 2, subtotal: 199800 },
  };
  await act(async () => finish(json({ cart: updated })));
  expect(await screen.findByLabelText('2 items in bag')).toHaveClass(
    'ss-bag-dot',
  );
  expect(
    fetch.mock.calls.filter(([url]) => url.includes('/cart/items/')),
  ).toHaveLength(1);
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:1234/cart/items/variant',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ quantity: 2 }),
      credentials: 'include',
    }),
  );
});

it('removes the last item and shows the empty state', async () => {
  const fetch = mockApi((url, options) =>
    url.includes('/cart/items/') && options.method === 'DELETE'
      ? json({ cart: emptyCart })
      : undefined,
  );
  render(<ExclusiveStore />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Remove Floral shirt' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Your bag is empty' }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('1 item in bag')).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:1234/cart/items/variant',
    expect.objectContaining({ method: 'DELETE' }),
  );
});

it('allows an over-stock quantity to be reduced to the available amount and blocks checkout until fixed', async () => {
  const unavailable = {
    ...cart,
    items: [
      {
        ...item,
        quantity: 5,
        maxQuantity: 3,
        available: false,
        issue: { message: 'Only 3 available.' },
      },
    ],
    summary: { ...cart.summary, checkoutEligible: false },
  };
  const fetch = mockApi((url, options) =>
    url.endsWith('/cart')
      ? json({ cart: unavailable })
      : options.method === 'PATCH'
        ? json({ cart })
        : undefined,
  );
  render(<ExclusiveStore />);
  const decrease = await screen.findByRole('button', {
    name: 'Decrease quantity of Floral shirt',
  });
  expect(decrease).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Increase quantity of Floral shirt' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Continue to checkout' }),
  ).toBeDisabled();
  fireEvent.click(decrease);
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:1234/cart/items/variant',
      expect.objectContaining({ body: JSON.stringify({ quantity: 3 }) }),
    ),
  );
});

it('preserves rows after a failed mutation and can refresh to recover', async () => {
  mockApi((url, options) =>
    options.method === 'PATCH'
      ? json({ message: 'Stock changed' }, 409)
      : undefined,
  );
  render(<ExclusiveStore />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Increase quantity of Floral shirt',
    }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Stock changed');
  expect(
    screen.getByRole('article', { name: 'Floral shirt' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh bag' }));
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
  );
});

it('returns to sign-in when the cart session expires', async () => {
  mockApi((url) =>
    url.endsWith('/cart')
      ? json({ message: 'Session expired' }, 401)
      : undefined,
  );
  render(<ExclusiveStore />);
  expect(
    await screen.findByRole('dialog', { name: 'Your account' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('reviews an address, adds ₹60 delivery and submits one COD order without client totals', async () => {
  query = 'checkout=1';
  let finish: (response: Response) => void = () => {};
  const fetch = mockApi((url, options) =>
    url.endsWith('/orders') && options.method === 'POST'
      ? new Promise<Response>((resolve) => {
          finish = resolve;
        })
      : undefined,
  );
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }));
  expect(
    screen.getByRole('heading', { name: 'Payment method' }),
  ).toBeInTheDocument();
  const place = screen.getByRole('button', { name: /Place order/ });
  expect(place).toHaveTextContent('1,059');
  fireEvent.click(place);
  fireEvent.click(place);
  await waitFor(() =>
    expect(
      fetch.mock.calls.filter(([url]) => url.endsWith('/orders')),
    ).toHaveLength(1),
  );
  const options = fetch.mock.calls.find(([url]) => url.endsWith('/orders'))![1];
  expect(JSON.parse(String(options.body))).toEqual({
    addressId: 'address',
    quoteToken: quote.quoteToken,
    paymentMethod: 'cod',
    requestId: expect.any(String),
  });
  await act(async () => finish(json({ order }, 201)));
  expect(replace).toHaveBeenCalledWith('/exclusive-store/?order=order-id');
});

it('saves a new delivery address through the API before enabling review', async () => {
  query = 'checkout=1';
  const fetch = mockApi((url, options) =>
    url.endsWith('/profile')
      ? json({ ...customer, addresses: [] })
      : url.endsWith('/profile/addresses') && options.method === 'POST'
        ? json({ address }, 201)
        : undefined,
  );
  render(<ExclusiveStore />);
  const name = await screen.findByLabelText('Full name');
  fireEvent.change(name, { target: { value: 'Test Customer' } });
  for (const [label, value] of [
    ['Phone number', '9876543210'],
    ['House, building and street', '12 Test Street'],
    ['City', 'Tiruppur'],
    ['State', 'Tamil Nadu'],
    ['PIN code', '641603'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  expect(screen.getByRole('button', { name: 'Review order' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Review order' })).toBeEnabled(),
  );
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:1234/profile/addresses',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        recipientName: 'Test Customer',
        phone: '+919876543210',
        addressLine1: '12 Test Street',
        addressLine2: '',
        city: 'Tiruppur',
        state: 'Tamil Nadu',
        postalCode: '641603',
        countryCode: 'IN',
        label: 'Home',
      }),
    }),
  );
});

it('retains the checkout request key for retries after an uncertain network result', async () => {
  query = 'checkout=1';
  let calls = 0;
  const fetch = mockApi((url, options) => {
    if (url.endsWith('/orders') && options.method === 'POST') {
      calls++;
      if (calls === 1) throw new Error('Connection lost');
      return json({ order });
    }
  });
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }));
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  await waitFor(() => expect(replace).toHaveBeenCalled());
  const requests = fetch.mock.calls.filter(([url]) => url.endsWith('/orders'));
  expect(requests[0][1].body).toBe(requests[1][1].body);
});

it('shows a real saved order confirmation and uses the customer-protected order endpoint', async () => {
  query = 'order=order-id';
  const fetch = mockApi((url) =>
    url.endsWith('/orders/order-id') ? json({ order }) : undefined,
  );
  render(<ExclusiveStore />);
  expect(
    await screen.findByRole('heading', { name: 'Order placed' }),
  ).toBeInTheDocument();
  expect(screen.getByText('SK-TEST123')).toBeInTheDocument();
  expect(screen.getByText(/Pay ₹1,059.00 on delivery/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:1234/orders/order-id',
    expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
  );
});

it('requires confirmation before cancelling an order and updates its saved status', async () => {
  query = 'order=order-id';
  const fetch = mockApi((url, options) => url.endsWith('/orders/order-id/cancel') && options.method === 'POST' ? json({ order: { ...order, status: 'cancelled' } }) : url.endsWith('/orders/order-id') ? json({ order }) : undefined);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
  expect(fetch.mock.calls.some(([url]) => url.endsWith('/cancel'))).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Keep order' }));
  expect(screen.queryByRole('button', { name: 'Confirm cancellation' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm cancellation' }));
  expect(await screen.findByRole('heading', { name: 'Order cancelled' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
});

it('does not offer cancellation for shipped orders', async () => {
  query = 'order=order-id'; mockApi(url => url.endsWith('/orders/order-id') ? json({ order: { ...order, status: 'shipped' } }) : undefined);
  render(<ExclusiveStore />);
  await screen.findByRole('heading', { name: 'Order shipped' });
  expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument();
});

it('applies and removes a coupon using server totals and submits the applied code', async () => {
  query = 'checkout=1';
  const discounted = { ...quote, coupon: { code: 'SAVE10', discount: 9990 }, discount: 9990, total: 95910 };
  const fetch = mockApi((url, options) => {
    if (url.includes('/checkout?couponCode=SAVE10')) return json(discounted);
    if (url.endsWith('/orders') && options.method === 'POST') return json({ order });
  });
  render(<ExclusiveStore />);
  const input = await screen.findByLabelText('Coupon code');
  fireEvent.change(input, { target: { value: 'save10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply coupon' }));
  expect(await screen.findByText('SAVE10 applied')).toBeInTheDocument();
  expect(screen.getByText('−₹99.90')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove coupon' }));
  await waitFor(() => expect(screen.queryByText('SAVE10 applied')).not.toBeInTheDocument());
  fireEvent.change(input, { target: { value: 'SAVE10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply coupon' }));
  await screen.findByText('SAVE10 applied');
  fireEvent.click(screen.getByRole('button', { name: 'Review order' }));
  fireEvent.click(screen.getByRole('button', { name: /Place order/ }));
  await waitFor(() => expect(fetch.mock.calls.some(([url, options]) => url.endsWith('/orders') && JSON.parse(String(options.body)).couponCode === 'SAVE10')).toBe(true));
});

it('shows coupon errors without replacing the last valid server quote', async () => {
  query = 'checkout=1';
  mockApi(url => url.includes('/checkout?couponCode=EXPIRED') ? json({ message: 'This coupon has expired.', code: 'COUPON_UNAVAILABLE' }, 400) : undefined);
  render(<ExclusiveStore />);
  fireEvent.change(await screen.findByLabelText('Coupon code'), { target: { value: 'EXPIRED' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply coupon' }));
  expect(await screen.findByText('This coupon has expired.')).toBeInTheDocument();
  expect(screen.getByText('₹1,059.00')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remove coupon' })).not.toBeInTheDocument();
});

it('renders separate payment cards and selects Razorpay when COD is disabled', async () => {
  query = 'checkout=1';
  mockApi(url => url.endsWith('/checkout') ? json({ ...quote, paymentMethods: ['razorpay'] }) : undefined);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }));
  expect(screen.queryByRole('radio', { name: 'Cash on delivery' })).not.toBeInTheDocument();
  const online = screen.getByRole('radio', { name: 'Pay online with Razorpay' });
  expect(online).toBeChecked();
  expect(online.closest('label')).toHaveClass('ss-payment-option');
  expect(screen.getByRole('button', { name: /Pay online ·/ })).toBeEnabled();
});

it('pauses checkout when both payment methods are disabled', async () => {
  query = 'checkout=1';
  mockApi(url => url.endsWith('/checkout') ? json({ ...quote, paymentMethods: [], paymentMessage: 'Checkout is temporarily unavailable.' }) : undefined);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Checkout is temporarily unavailable.');
  expect(screen.queryByRole('radio', { name: 'Cash on delivery' })).not.toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: 'Pay online with Razorpay' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Place order ·/ })).toBeDisabled();
});

it('refreshes payment settings on focus and replaces a disabled selection', async () => {
  query = 'checkout=1';
  let onlineOnly = false;
  mockApi(url => url.endsWith('/checkout') ? json({ ...quote, quoteToken: onlineOnly ? 'b'.repeat(64) : quote.quoteToken, paymentMethods: onlineOnly ? ['razorpay'] : ['cod', 'razorpay'] }) : undefined);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Review order' }));
  expect(screen.getByRole('radio', { name: 'Cash on delivery' })).toBeChecked();
  onlineOnly = true;
  fireEvent.focus(window);
  await waitFor(() => expect(screen.queryByRole('radio', { name: 'Cash on delivery' })).not.toBeInTheDocument());
  expect(screen.getByRole('radio', { name: 'Pay online with Razorpay' })).toBeChecked();
  expect(screen.getByText(/Payment options or order totals changed/)).toBeInTheDocument();
});
