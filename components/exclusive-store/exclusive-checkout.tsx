'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, MapPin } from 'lucide-react';
import {
  StoreApiError,
  storeRequest,
  exclusiveLink,
  price,
  type Address,
  type CheckoutQuote,
  type Customer,
  type Order,
} from '@/lib/store-api';
import DeliveryAddressForm from './delivery-address-form';
import type { StoreCart } from './use-store-cart';

export default function ExclusiveCheckout({
  onExpired,
  cartResource,
}: {
  onExpired: () => void;
  cartResource: StoreCart;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [selected, setSelected] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const pending = useRef(false);
  const requestId = useRef('');
  const loadError = useCallback(
    (error: unknown) => {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else
        setError(
          error instanceof Error ? error.message : 'Could not open checkout.',
        );
    },
    [onExpired],
  );
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      storeRequest<Customer>('/profile', { signal: controller.signal }),
      storeRequest<CheckoutQuote>('/checkout', { signal: controller.signal }),
    ])
      .then(([profile, result]) => {
        if (controller.signal.aborted) return;
        setCustomer(profile);
        setQuote(result);
        setLoading(false);
        setError('');
        setReview(false);
        requestId.current = '';
        setSelected((current) =>
          profile.addresses?.some((address) => address._id === current)
            ? current
            : profile.addresses?.find((address) => address.isDefaultShipping)
                ?._id ||
              profile.addresses?.[0]?._id ||
              '',
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoading(false);
          loadError(error);
        }
      });
    return () => controller.abort();
  }, [retry, loadError]);
  const address = customer?.addresses?.find((item) => item._id === selected);
  async function submit() {
    if (
      !quote ||
      !address ||
      pending.current ||
      !quote.cart.summary.checkoutEligible ||
      error
    )
      return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      // Keep the key across uncertain network results; getRandomValues also works on LAN previews.
      requestId.current ||=
        crypto.randomUUID?.() ||
        Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
          value.toString(16).padStart(2, '0'),
        ).join('');
      const { order } = await storeRequest<{ order: Order }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          addressId: address._id,
          quoteToken: quote.quoteToken,
          paymentMethod: 'cod',
          requestId: requestId.current,
        }),
      });
      void cartResource.refresh();
      router.replace(exclusiveLink({ order: order._id }));
    } catch (error) {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else
        setError(
          error instanceof Error
            ? error.message
            : 'Could not place your order.',
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function saved(address: Address) {
    setCustomer((current) =>
      current
        ? { ...current, addresses: [...(current.addresses || []), address] }
        : current,
    );
    setSelected(address._id);
    setAddingAddress(false);
    requestId.current = '';
  }
  if (loading)
    return (
      <div className="ss-loading" role="status">
        Opening checkout…
      </div>
    );
  if (!quote || !customer)
    return (
      <section className="ss-message" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="button dark"
          onClick={() => {
            setLoading(true);
            setRetry((value) => value + 1);
          }}
        >
          Try again
        </button>
      </section>
    );
  return (
    <section className="ss-catalog ss-checkout" aria-label="Checkout">
      <div className="ss-bag-heading">
        <h1>Checkout</h1>
      </div>
      <ol className="ss-checkout-steps" aria-label="Checkout steps">
        <li aria-current={!review ? 'step' : undefined}>1 · Delivery</li>
        <li aria-current={review ? 'step' : undefined}>
          2 · Review & place order
        </li>
      </ol>
      {!quote.cart.summary.checkoutEligible ||
      quote.cart.summary.currency !== 'INR' ? (
        <div className="ss-error" role="alert">
          {quote.cart.items.length
            ? 'Update unavailable items in your bag before checkout. Checkout supports INR prices only.'
            : 'Your bag is empty. Add an item before checkout.'}
        </div>
      ) : (
        <div className="ss-bag-layout">
          <div className="ss-checkout-main">
            {!review ? (
              <section className="ss-checkout-panel">
                <h2>
                  <MapPin size={18} aria-hidden="true" />
                  Deliver to
                </h2>
                {customer.addresses?.length ? (
                  <fieldset className="ss-address-list">
                    <legend className="sr-only">
                      Choose a delivery address
                    </legend>
                    {customer.addresses.map((item) => (
                      <label
                        key={item._id}
                        className="ss-address-choice"
                        data-selected={selected === item._id}
                      >
                        <input
                          type="radio"
                          name="deliveryAddress"
                          value={item._id}
                          checked={selected === item._id}
                          disabled={item.countryCode !== 'IN'}
                          onChange={() => {
                            setSelected(item._id);
                            requestId.current = '';
                          }}
                        />
                        <span>
                          <strong>{item.recipientName}</strong>
                          <span>
                            {item.addressLine1}
                            {item.addressLine2 ? `, ${item.addressLine2}` : ''}
                          </span>
                          <span>
                            {item.city}, {item.state} {item.postalCode}
                          </span>
                          <span>{item.phone}</span>
                          {item.countryCode !== 'IN' && (
                            <small>Delivery is available within India.</small>
                          )}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}
                {addingAddress || !customer.addresses?.length ? (
                  <DeliveryAddressForm
                    customer={customer}
                    onSaved={saved}
                    onExpired={onExpired}
                    onCancel={
                      customer.addresses?.length
                        ? () => setAddingAddress(false)
                        : undefined
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className="ss-text-button"
                    onClick={() => setAddingAddress(true)}
                  >
                    + Add an address
                  </button>
                )}
                <button
                  type="button"
                  className="button dark full ss-review-button"
                  disabled={
                    !address || address.countryCode !== 'IN' || addingAddress
                  }
                  onClick={() => {
                    setReview(true);
                    setError('');
                  }}
                >
                  Review order
                </button>
              </section>
            ) : (
              <>
                <section className="ss-checkout-panel">
                  <div className="ss-checkout-panel-top">
                    <h2>Delivery address</h2>
                    <button
                      type="button"
                      className="ss-text-button"
                      disabled={busy}
                      onClick={() => setReview(false)}
                    >
                      Change
                    </button>
                  </div>
                  <address>
                    <strong>{address?.recipientName}</strong>
                    <span>
                      {address?.addressLine1}
                      {address?.addressLine2 ? `, ${address.addressLine2}` : ''}
                    </span>
                    <span>
                      {address?.city}, {address?.state} {address?.postalCode}
                    </span>
                    <span>{address?.phone}</span>
                  </address>
                </section>
                <section className="ss-checkout-panel">
                  <h2>
                    <Banknote size={18} aria-hidden="true" />
                    Cash on delivery
                  </h2>
                  <p>
                    Pay {price(quote.total, quote.currency)} when your order
                    arrives.
                  </p>
                </section>
                <section className="ss-checkout-panel">
                  <h2>Your items</h2>
                  <ul className="ss-review-items">
                    {quote.cart.items.map((item) => (
                      <li key={item.variantId}>
                        <div>
                          <strong>{item.product?.name}</strong>
                          <span>
                            {item.variant?.options?.color?.name} ·{' '}
                            {item.variant?.options?.size} · Qty {item.quantity}
                          </span>
                        </div>
                        <span>
                          {price(
                            item.lineTotal ?? undefined,
                            item.currency || 'INR',
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
          <aside className="ss-bag-summary">
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{price(quote.cart.summary.subtotal, quote.currency)}</dd>
              </div>
              <div>
                <dt>Delivery within India</dt>
                <dd>{price(quote.shipping, quote.currency)}</dd>
              </div>
              <div className="ss-checkout-total">
                <dt>Total</dt>
                <dd>{price(quote.total, quote.currency)}</dd>
              </div>
            </dl>
            {error && (
              <div className="ss-error" role="alert">
                {error}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setLoading(true);
                    setRetry((value) => value + 1);
                  }}
                >
                  Review latest bag
                </button>
              </div>
            )}
            {review && (
              <button
                type="button"
                className="button dark full"
                disabled={busy || Boolean(error)}
                onClick={() => void submit()}
              >
                {busy
                  ? 'Placing order…'
                  : 'Place order · ' + price(quote.total, quote.currency)}
              </button>
            )}
            <p className="ss-help">Cash on delivery · India only</p>
          </aside>
        </div>
      )}
    </section>
  );
}
