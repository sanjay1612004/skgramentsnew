'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, MapPin, CreditCard, Check, ShieldCheck } from 'lucide-react';
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
import { payWithRazorpay } from '@/lib/razorpay';
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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const currentQuote = useRef<CheckoutQuote | null>(null);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const couponPending = useRef(false);
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
        setCouponCode('');
        setCouponError('');
        setPaymentMethod(current => result.paymentMethods.includes(current) ? current : result.paymentMethods[0] || '');
        setLoading(false);
        setError('');
        setCheckoutNotice('');
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
  useEffect(() => { currentQuote.current = quote; }, [quote]);
  const hasQuote = Boolean(quote);
  const appliedCode = quote?.coupon?.code || '';
  useEffect(() => {
    if (!hasQuote) return;
    const controller = new AbortController();
    let refreshing = false;
    async function refreshOptions() {
      if (document.visibilityState === 'hidden' || refreshing || pending.current || couponPending.current) return;
      refreshing = true;
      try {
        const result = await storeRequest<CheckoutQuote>('/checkout' + (appliedCode ? '?couponCode=' + encodeURIComponent(appliedCode) : ''), { signal: controller.signal });
        if (controller.signal.aborted || pending.current || couponPending.current) return;
        if (currentQuote.current?.quoteToken !== result.quoteToken) {
          setQuote(result);
          setPaymentMethod(current => result.paymentMethods.includes(current) ? current : result.paymentMethods[0] || '');
          setCheckoutNotice('Payment options or order totals changed. Please review the latest details.');
          requestId.current = '';
        }
      } catch (error) {
        if (!controller.signal.aborted) loadError(error);
      } finally { refreshing = false; }
    }
    const interval = window.setInterval(() => void refreshOptions(), 30000);
    const refresh = () => void refreshOptions();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [hasQuote, appliedCode, loadError]);
  const address = customer?.addresses?.find((item) => item._id === selected);
  async function applyCoupon(remove = false) {
    if (pending.current || couponPending.current) return;
    couponPending.current = true;
    setCouponBusy(true); setCouponError('');
    try {
      const code = remove ? '' : couponCode.trim().toUpperCase();
      if (!remove && !code) throw new Error('Enter a coupon code.');
      const result = await storeRequest<CheckoutQuote>('/checkout' + (code ? '?couponCode=' + encodeURIComponent(code) : ''));
      setQuote(result); setCouponCode(result.coupon?.code || ''); setError('');
      setPaymentMethod(current => result.paymentMethods.includes(current) ? current : result.paymentMethods[0] || '');
      requestId.current = '';
    } catch (error) {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else setCouponError(error instanceof Error ? error.message : 'Could not update coupon.');
    } finally { couponPending.current = false; setCouponBusy(false); }
  }
  async function submit() {
    if (
      !quote ||
      !address ||
      pending.current ||
      couponPending.current ||
      !quote.cart.summary.checkoutEligible ||
      !quote.paymentMethods.includes(paymentMethod) ||
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
          paymentMethod,
          requestId: requestId.current,
          ...(quote.coupon ? { couponCode: quote.coupon.code } : {}),
        }),
      });
      if (paymentMethod === 'razorpay') {
        try { await payWithRazorpay(order._id); }
        catch { router.replace(exclusiveLink({ order: order._id })); return; }
      }
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
                <section className="ss-checkout-panel ss-payment-panel">
                  <h2 id="payment-method-title"><CreditCard size={19} aria-hidden="true" />Payment method</h2>
                  <p className="ss-payment-intro">Choose how you’d like to pay.</p>
                  {quote.paymentMethods.length ? <fieldset className="ss-payment-options" aria-labelledby="payment-method-title">
                    {quote.paymentMethods.map(method => {
                      const isSelected = paymentMethod === method;
                      const title = method === 'cod' ? 'Cash on delivery' : method === 'free' ? 'No payment required' : 'Pay online with Razorpay';
                      const description = method === 'cod' ? 'Pay when your order arrives.' : method === 'free' ? 'Your order total is ₹0.' : 'Pay securely online through Razorpay.';
                      const PaymentIcon = method === 'cod' ? Banknote : method === 'free' ? Check : CreditCard;
                      return <label key={method} className="ss-payment-option" data-selected={isSelected}>
                        <input type="radio" name="paymentMethod" aria-label={title} value={method} checked={isSelected} disabled={busy || couponBusy} onChange={() => { setPaymentMethod(method); requestId.current = ''; }} />
                        <span className="ss-payment-icon"><PaymentIcon size={21} aria-hidden="true" /></span>
                        <span className="ss-payment-copy"><strong>{title}</strong><span>{description}</span></span>
                        {isSelected && <span className="ss-payment-selected"><Check size={13} aria-hidden="true" />Selected</span>}
                      </label>;
                    })}
                  </fieldset> : <div className="ss-payment-unavailable" role="alert">{quote.paymentMessage || 'Checkout is temporarily unavailable. Please try again later or contact the store.'}</div>}
                  {paymentMethod === 'razorpay' && <p className="ss-payment-note">Stock is confirmed after payment. If an item becomes unavailable, we’ll contact you to fulfill your order or arrange a refund.</p>}
                  <div className="ss-payment-footer"><ShieldCheck size={15} aria-hidden="true" /><span>Your order total is confirmed before payment.</span></div>
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
            <form className="ss-coupon-form" onSubmit={event => { event.preventDefault(); void applyCoupon(); }}>
              <label htmlFor="checkout-coupon">Coupon code</label>
              <input id="checkout-coupon" value={couponCode} maxLength={32} autoCapitalize="characters" autoComplete="off" disabled={busy || couponBusy} onChange={event => setCouponCode(event.target.value)} />
              <button type="submit" className="button outline" disabled={busy || couponBusy}>{couponBusy ? 'Updating…' : 'Apply coupon'}</button>
              {quote.coupon && <><p role="status">{quote.coupon.code} applied</p><button type="button" className="ss-text-button" disabled={busy || couponBusy} onClick={() => void applyCoupon(true)}>Remove coupon</button></>}
              {couponError && <p className="ss-error" role="alert">{couponError}</p>}
            </form>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{price(quote.cart.summary.subtotal, quote.currency)}</dd>
              </div>
              <div>
                <dt>Delivery within India</dt>
                <dd>{price(quote.shipping, quote.currency)}</dd>
              </div>
              {!!quote.discount && <div><dt>Coupon {quote.coupon?.code}</dt><dd>−{price(quote.discount, quote.currency)}</dd></div>}
              <div className="ss-checkout-total">
                <dt>Total</dt>
                <dd>{price(quote.total, quote.currency)}</dd>
              </div>
            </dl>
            {checkoutNotice && <p className="ss-checkout-notice" role="status">{checkoutNotice}</p>}
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
                disabled={busy || couponBusy || Boolean(error) || !quote.paymentMethods.includes(paymentMethod)}
                onClick={() => void submit()}
              >
                {busy
                  ? 'Placing order…'
                  : (paymentMethod === 'razorpay' ? 'Pay online · ' : 'Place order · ') + price(quote.total, quote.currency)}
              </button>
            )}
            <p className="ss-help">Delivery within India</p>
          </aside>
        </div>
      )}
    </section>
  );
}
