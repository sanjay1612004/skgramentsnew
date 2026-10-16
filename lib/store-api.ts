export class StoreApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

export function storeApiBase() {
  const configured = process.env.NEXT_PUBLIC_STORE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return 'http://localhost:1234';
  throw new StoreApiError('The exclusive store is not available yet. Please contact THE SK APPARELS.');
}

export async function storeRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = storeApiBase();
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...options, credentials: 'include', cache: 'no-store',
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new StoreApiError('We could not reach the store. Please try again.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new StoreApiError(body?.message || 'The request could not be completed.', response.status);
  if (body === null) throw new StoreApiError('The store returned an unexpected response. Please try again.');
  return body as T;
}

export type Address = { _id: string; label?: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string; landmark?: string; city: string; state: string; postalCode: string; countryCode: string; isDefaultShipping?: boolean };
export type Customer = { _id: string; firstName: string; lastName: string; emailId: string; roles: string[]; avatarUrl?: string | null; phone?: string; addresses?: Address[] };
export type CatalogImage = { url: string; altText?: string; isPrimary?: boolean };
export type Category = { _id: string; name: string; slug: string; description?: string; image?: CatalogImage; productCount?: number };
export type Variant = {
  _id: string; sku: string; title?: string; status: string;
  options?: { color?: { name?: string; hex?: string }; size?: string };
  pricing: { price: number; currency: string; compareAtPrice?: number };
  inventory: { trackQuantity?: boolean; quantity?: number; reserved?: number; allowBackorder?: boolean };
};
export type Product = {
  _id: string; name: string; slug: string; brand?: string; shortDescription: string;
  description: string; primaryCategory?: Category; images: CatalogImage[];
  variants: Variant[]; priceRange?: { minimum: number; maximum: number };
};
export type ProductList = { data: Product[]; pagination: { page: number; pages: number; total: number } };
export type CartItem = {
  variantId: string; quantity: number; unitPrice: number | null; compareAtPrice?: number | null; lineTotal: number | null; currency: string | null; available: boolean; maxQuantity: number;
  product: { name: string; slug: string; isSecret: boolean; image?: CatalogImage } | null;
  variant?: { sku: string; options?: Variant['options'] }; issue?: { message: string };
};
export type Cart = { items: CartItem[]; summary: { itemCount: number; subtotal: number; currency: string | null; discountTotal: number; checkoutEligible: boolean; issueCount: number } };
export type CheckoutQuote = { cart: Cart; quoteToken: string; shipping: number; total: number; currency: string; countryCode: string; paymentMethods: string[] };
export type Order = { _id: string; number: string; status: string; paymentMethod: string; paymentStatus: string; shippingAddress: Address; currency: string; subtotal: number; shipping: number; total: number; createdAt: string; items: { variantId: string; name: string; color?: string; size?: string; quantity: number; unitPrice: number; lineTotal: number }[] };

export function price(amount: number | undefined, currency = 'INR') {
  return Number.isFinite(amount) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount! / 100) : 'Price unavailable';
}
export function available(variant: Variant) {
  return variant.status === 'active' && (!variant.inventory.trackQuantity || variant.inventory.allowBackorder || (variant.inventory.quantity ?? 0) - (variant.inventory.reserved ?? 0) > 0);
}
export function stockAvailability(variants: Variant[]) {
  const active = variants.filter((variant) => variant.status === 'active');
  const quantity = active.reduce((total, variant) => total + (variant.inventory.trackQuantity
    ? Math.max((variant.inventory.quantity ?? 0) - (variant.inventory.reserved ?? 0), 0) : 0), 0);
  if (active.some((variant) => !variant.inventory.trackQuantity)) return { label: 'In stock', available: true };
  if (quantity > 0) return { label: `${quantity} in stock`, available: true };
  if (active.some((variant) => variant.inventory.allowBackorder)) return { label: 'Available on backorder', available: true };
  return { label: 'Sold out', available: false };
}
export function exclusiveLink(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
  return '/exclusive-store/' + (query ? '?' + query : '');
}
