import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import ExclusiveStore from '../components/exclusive-store/exclusive-store';
import Navigation from '../components/navigation';

let query = '';
const replaceRoute = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: replaceRoute }), useSearchParams: () => new URLSearchParams(query), usePathname: () => '/exclusive-store/' }));
vi.mock('../components/modal-provider', () => ({ useModal: () => ({ openQuote: vi.fn() }) }));
vi.mock('next/link', () => ({ default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));
const customer = { _id: 'customer', firstName: 'Sanjay', lastName: 'Customer', emailId: 'customer@example.com', roles: ['customer'], avatarUrl: 'https://example.com/profile.jpg' };
const category = { _id: 'tees', name: 'Private tees', slug: 'private-tees', productCount: 1, image: { url: 'https://example.com/tees.png', altText: 'Cotton tees category' } };
const product = { _id: 'product', name: 'Secret cotton tee', slug: 'secret-cotton-tee', shortDescription: 'Cotton', description: 'A cotton tee.', images: [], primaryCategory: category, variants: [{ _id: 'variant', sku: 'SK-M', status: 'active', pricing: { currency: 'INR', price: 99900 }, inventory: { trackQuantity: true, quantity: 2 }, options: { color: { name: 'Black' }, size: 'M' } }], priceRange: { minimum: 99900 } };
const emptyCart = { items: [], summary: { itemCount: 0, subtotal: 0, currency: null, discountTotal: 0, checkoutEligible: false, issueCount: 0 } };
function response(body: unknown, status = 200) { return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })); }
beforeEach(() => { query = ''; replaceRoute.mockClear(); vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', 'http://localhost:1234'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('keeps private data hidden until login and confirms the session cookie', async () => {
  let signedIn = false;
  const fetch = vi.fn((url: string) => {
    if (url.endsWith('/profile')) return signedIn ? response(customer) : response({ message: 'Sign in required' }, 401);
    if (url.endsWith('/login')) { signedIn = true; return response(customer); }
    if (url.endsWith('/exclusive-store/categories')) return response({ data: [category] });
    throw new Error('Unexpected request ' + url);
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  expect(await screen.findByText('Welcome back.')).toBeInTheDocument();
  expect(fetch.mock.calls.every(([url]) => url.endsWith('/profile'))).toBe(true);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'customer@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password-123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enter the exclusive store' }));
  expect(await screen.findByRole('link', { name: /Private tees/ })).toHaveAttribute('href', '/exclusive-store/?category=private-tees');
  expect(screen.getByAltText('Cotton tees category')).toHaveAttribute('src', category.image.url);
  expect(screen.queryByText('01 / CHOOSE YOUR COLLECTION')).not.toBeInTheDocument();
  expect(screen.queryByText('THE COLLECTIONS.')).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('http://localhost:1234/login', expect.objectContaining({ credentials: 'include', method: 'POST' }));
  expect(fetch.mock.calls.filter(([url]) => url.endsWith('/profile'))).toHaveLength(2);
});

it('reuses a signed-in account and displays category products on the next view', async () => {
  query = 'category=private-tees';
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.endsWith('/profile')) return response(customer);
    if (url.includes('/categories/')) return response({ category });
    return response({ data: [product], pagination: { total: 1, page: 1, pages: 1 } });
  }));
  render(<ExclusiveStore />);
  expect(await screen.findByRole('link', { name: /Secret cotton tee/ })).toHaveAttribute('href', '/exclusive-store/?category=private-tees&product=secret-cotton-tee');
  expect(screen.getByText('2 in stock')).toBeInTheDocument();
  expect(screen.queryByText('Welcome back.')).not.toBeInTheDocument();
});

it('offers sign-in only without any account registration option', async () => {
  const fetch = vi.fn(() => response({ message: 'Authentication required' }, 401));
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  await screen.findByRole('dialog', { name: 'Your account' });
  expect(screen.queryByText('Create account')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([url]) => url.endsWith('/signup'))).toBe(false);
});

it('does not show private data when the browser has not accepted a login cookie', async () => {
  const fetch = vi.fn((url: string) => url.endsWith('/login') ? response(customer) : response({ message: 'Authentication required' }, 401));
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  await screen.findByText('Welcome back.');
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'customer@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password-123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enter the exclusive store' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Authentication required');
  expect(fetch.mock.calls.some(([url]) => url.includes('/exclusive-store/'))).toBe(false);
});

it('returns to login when a protected request reports an expired session', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/profile') ? response(customer) : response({ message: 'Session expired' }, 401)));
  render(<ExclusiveStore />);
  expect(await screen.findByText('Welcome back.')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Private tees/ })).not.toBeInTheDocument();
});

it('adds the selected variant to the shared server bag with quantity, without trusting client prices', async () => {
  query = 'product=secret-cotton-tee';
  const fetch = vi.fn((url: string) => {
    if (url.endsWith('/profile')) return response(customer);
    if (url.includes('/exclusive-store/products/')) return response(product);
    return response({ cart: emptyCart });
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add to your bag' }));
  expect(await screen.findByText(/Added to your bag/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('http://localhost:1234/cart/items', expect.objectContaining({ credentials: 'include', method: 'POST', body: JSON.stringify({ variantId: 'variant', quantity: 1 }) }));
});

it('clearly marks a zero-stock product as sold out and prevents bag requests', async () => {
  query = 'product=nova-floral-shirt';
  const soldOutProduct = { ...product, name: 'nova-floral shirt', variants: product.variants.map(variant => ({ ...variant, inventory: { trackQuantity: true, quantity: 0, reserved: 0, allowBackorder: false } })) };
  const fetch = vi.fn((url: string) => url.endsWith('/profile') ? response(customer) : response(soldOutProduct));
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  const button = await screen.findByRole('button', { name: 'Sold out' });
  expect(button).toBeDisabled();
  expect(screen.getByText('This piece is currently sold out.')).toBeInTheDocument();
  expect(screen.queryByText('Choose an available option to add this piece.')).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(fetch.mock.calls.some(([url]) => url.endsWith('/cart/items'))).toBe(false);
});

it('updates stock and price for the selected option and supports gallery navigation', async () => {
  query = 'product=secret-cotton-tee';
  const multiOption = { ...product, images: [{ url: 'https://example.com/front.jpg', altText: 'Front' }, { url: 'https://example.com/back.jpg', altText: 'Back' }], variants: [product.variants[0], { ...product.variants[0], _id: 'large', options: { color: { name: 'Black' }, size: 'L' }, pricing: { currency: 'INR', price: 109900 }, inventory: { trackQuantity: true, quantity: 5, reserved: 2 } }] };
  const fetch = vi.fn((url: string) => url.endsWith('/profile') ? response(customer) : url.endsWith('/cart/items') || url.endsWith('/cart') ? response({ cart: emptyCart }) : response(multiOption));
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  expect(await screen.findByText('5 in stock across all options')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add to your bag' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Black \/ L/ }));
  expect(screen.getByRole('button', { name: /Black \/ L/ })).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('.ss-product-heading .ss-stock')).toHaveTextContent('3 in stock');
  expect(document.querySelector('.ss-detail-price')).toHaveTextContent('1,099');
  fireEvent.click(screen.getByRole('button', { name: 'Next product image' }));
  expect(screen.getByAltText('Back')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next product image' }));
  expect(screen.getByAltText('Front')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add to your bag' }));
  await screen.findByText(/Added to your bag/);
  expect(fetch).toHaveBeenCalledWith('http://localhost:1234/cart/items', expect.objectContaining({ body: JSON.stringify({ variantId: 'large', quantity: 1 }) }));
});

it('blocks non-customer accounts and lets them open the login modal', async () => {
  const fetch = vi.fn((url: string) => {
    if (url.endsWith('/profile')) return response({ ...customer, roles: ['support'] });
    return response({ message: 'Logged out' });
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  expect(await screen.findByText('Customer access only.')).toBeInTheDocument();
  expect(fetch.mock.calls).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Use another account' }));
  await waitFor(() => expect(screen.getByText('Welcome back.')).toBeInTheDocument());
});

it('shows only the logo, bag and profile picture in the exclusive navbar', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/profile') ? response(customer) : response({ data: [category] })));
  render(<><Navigation /><ExclusiveStore /></>);
  const profile = await screen.findByRole('button', { name: 'Open profile menu' });
  expect(within(profile).getByAltText('')).toHaveAttribute('src', customer.avatarUrl);
  expect(screen.getAllByRole('link', { name: 'THE SK APPARELS home' })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Shopping bag' })).toHaveAttribute('href', '/exclusive-store/?bag=1');
  expect(screen.queryByText('Back to store')).not.toBeInTheDocument();
  expect(screen.queryByText('All collections')).not.toBeInTheDocument();
  expect(screen.queryByText('GET A QUOTE')).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
});

it('opens profile actions, saves profile edits and updates the navbar avatar', async () => {
  const updated = { ...customer, firstName: 'Kishore', avatarUrl: 'https://example.com/new-profile.jpg' };
  const fetch = vi.fn((url: string) => {
    if (url.endsWith('/profile/edit')) return response({ user: updated });
    if (url.endsWith('/profile')) return response(customer);
    return response({ data: [category] });
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open profile menu' }));
  expect(screen.getByRole('dialog', { name: 'Your profile' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Kishore' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(fetch).toHaveBeenCalledWith('http://localhost:1234/profile/edit', expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ firstName: 'Kishore', lastName: 'Customer', phone: '' }) }));
  expect(within(screen.getByRole('button', { name: 'Open profile menu' })).getByAltText('')).toHaveAttribute('src', updated.avatarUrl);
});

it('opens login as a modal, supports Escape and can reopen it from the profile icon', async () => {
  vi.stubGlobal('fetch', vi.fn(() => response({ message: 'Authentication required' }, 401)));
  render(<ExclusiveStore />);
  expect(await screen.findByRole('dialog', { name: 'Your account' })).toBeInTheDocument();
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).not.toBe('hidden');
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Exclusive store account' })).getByRole('button', { name: 'Sign in' }));
  expect(screen.getByRole('dialog', { name: 'Your account' })).toBeInTheDocument();
});

it('signs out through profile actions, hides private products and returns home', async () => {
  const fetch = vi.fn((url: string) => {
    if (url.endsWith('/profile')) return response(customer);
    if (url.endsWith('/logout')) return response({ message: 'Logged out' });
    return response({ data: [category] });
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  await screen.findByRole('link', { name: /Private tees/ });
  fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen.queryByRole('link', { name: /Private tees/ })).not.toBeInTheDocument());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('http://localhost:1234/logout', expect.objectContaining({ method: 'POST' }));
  expect(replaceRoute).toHaveBeenCalledWith('/');
});

it('keeps profile actions open and does not navigate if logout fails', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.endsWith('/profile')) return response(customer);
    if (url.endsWith('/logout')) return response({ message: 'Could not sign out' }, 503);
    return response({ data: [category] });
  }));
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open profile menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign out');
  expect(screen.getByRole('dialog', { name: 'Your profile' })).toBeInTheDocument();
  expect(replaceRoute).not.toHaveBeenCalled();
});

it('anchors profile actions beside the avatar and dismisses them with Escape or outside clicks', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/profile') ? response(customer) : response({ data: [category] })));
  render(<ExclusiveStore />);
  const trigger = await screen.findByRole('button', { name: 'Open profile menu' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Your profile' });
  expect(trigger.parentElement).toContainElement(dialog);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('.ss-modal-overlay')).not.toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(trigger);
  fireEvent.pointerDown(screen.getByRole('link', { name: 'THE SK APPARELS home' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('does not revive a logged-out session when an older profile check finishes late', async () => {
  let calls = 0;
  let finish: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.endsWith('/profile')) {
      calls++;
      return calls === 1 ? response(customer) : new Promise<Response>((resolve) => { finish = resolve; });
    }
    if (url.endsWith('/logout')) return response({ message: 'Logged out' });
    return response({ data: [category] });
  }));
  render(<ExclusiveStore />);
  await screen.findByRole('button', { name: 'Open profile menu' });
  fireEvent.focus(window);
  fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByText('Sign in to browse the exclusive collection.');
  await act(async () => { finish(new Response(JSON.stringify(customer))); });
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Open profile menu' })).not.toBeInTheDocument());
});

it('updates the header photo immediately while keeping profile editing open', async () => {
  const updated = { ...customer, avatarUrl: 'https://example.com/uploaded-profile.png' };
  const fetch = vi.fn((url: string, options?: RequestInit) => {
    if (url.endsWith('/profile/photo')) return response({ user: options?.method === 'DELETE' ? { ...customer, avatarUrl: null } : updated });
    if (url.endsWith('/profile')) return response(customer);
    return response({ data: [category] });
  });
  vi.stubGlobal('fetch', fetch);
  render(<ExclusiveStore />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open profile menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Unsaved name' } });
  fireEvent.change(screen.getByLabelText('Profile photo'), { target: { files: [new File(['photo'], 'profile.png', { type: 'image/png' })] } });
  await screen.findByText('Profile photo updated.');
  expect(within(screen.getByRole('button', { name: 'Open profile menu' })).getByAltText('')).toHaveAttribute('src', updated.avatarUrl);
  expect(screen.getByRole('dialog', { name: 'Your profile' })).toBeInTheDocument();
  expect(screen.getByLabelText('First name')).toHaveValue('Unsaved name');
  fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
  await screen.findByText('Profile photo removed.');
  expect(within(screen.getByRole('button', { name: 'Open profile menu' })).queryByAltText('')).not.toBeInTheDocument();
});
