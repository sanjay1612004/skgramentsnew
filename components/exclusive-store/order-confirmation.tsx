'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, CreditCard, MapPin, PackageCheck, ShoppingBag, X } from 'lucide-react';
import {
  StoreApiError,
  storeRequest,
  exclusiveLink,
  price,
  type Order,
} from '@/lib/store-api';

import { payWithRazorpay } from '@/lib/razorpay';

const headings: Record<string, string> = {
  awaiting_payment: 'Complete your payment',
  payment_review: 'Payment received — order under review',
  confirmed: 'Order placed',
  processing: 'Preparing your order',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
};

export default function OrderConfirmation({
  identifier,
  onExpired,
}: {
  identifier: string;
  onExpired: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRetry(value => value + 1); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
    };
  }, []);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  async function cancel() {
    if (cancelling) return;
    setCancelling(true); setError('');
    try {
      const result = await storeRequest<{ order: Order }>('/orders/' + encodeURIComponent(identifier) + '/cancel', { method: 'POST' });
      setOrder(result.order); setConfirmCancel(false);
    } catch (error) {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else setError(error instanceof Error ? error.message : 'Could not cancel your order.');
    } finally { setCancelling(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    storeRequest<{ order: Order }>(
      '/orders/' + encodeURIComponent(identifier),
      { signal: controller.signal },
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setOrder(result.order);
          setError('');
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof StoreApiError && error.status === 401) onExpired();
        else
          setError(
            error instanceof Error
              ? error.message
              : 'Could not load your order.',
          );
      });
    return () => controller.abort();
  }, [identifier, onExpired, retry]);
  if (!order)
    return error ? (
      <section className="ss-message" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="button dark"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
      </section>
    ) : (
      <div className="ss-loading" role="status">
        Loading your order…
      </div>
    );
  const isCancelled = order.status === 'cancelled';
  const isAwaitingPayment = order.status === 'awaiting_payment';
  const isPaymentReview = order.status === 'payment_review';
  const isPaid = order.paymentStatus === 'paid' && !isCancelled && !isAwaitingPayment && !isPaymentReview;
  const isComplete = !isCancelled && !isAwaitingPayment && !isPaymentReview;
  const isCOD = order.paymentMethod === 'cod';
  const message = isCancelled
    ? 'This order has been cancelled.'
    : isPaymentReview
      ? 'Payment received. The store will contact you to confirm availability or arrange a refund.'
      : order.total === 0
        ? 'No payment is required. We’ll take it from here.'
        : isPaid
          ? 'Payment received. Your order is in good hands.'
          : isAwaitingPayment
            ? 'Your order is awaiting online payment. Stock is confirmed after payment.'
            : order.status === 'delivered'
              ? `Payment due: ${price(order.total, order.currency)}.`
              : `Pay ${price(order.total, order.currency)} on delivery.`;
  const HeroIcon = isCancelled ? X : isAwaitingPayment ? CreditCard : isPaymentReview ? Clock3 : order.status === 'delivered' ? PackageCheck : Check;
  return (
    <section className="ss-catalog ss-order-confirmation" data-state={isPaid ? 'paid' : isComplete ? 'placed' : isCancelled ? 'cancelled' : 'pending'}>
      <div className="ss-confirmation-hero">
        {isPaid && <div className="ss-confirmation-confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ left: `${(index + 1) * 5.88}%`, animationDelay: `${(index % 5) * 110}ms` }} />)}</div>}
        <div className="ss-confirmation-hero-content">
          <span className="ss-confirmation-eyebrow">THE SK APPARELS <span aria-hidden="true">/</span> EXCLUSIVE STORE</span>
          <div className="ss-order-check"><HeroIcon size={30} strokeWidth={1.8} aria-hidden="true" /></div>
          <span className="ss-confirmation-status">{isPaid ? 'Payment confirmed' : isAwaitingPayment ? 'Payment pending' : isPaymentReview ? 'Under review' : isCancelled ? 'Cancelled' : isCOD ? 'Cash on delivery' : 'Order confirmed'}</span>
          <h1>{headings[order.status] || 'Your order'}</h1>
          <p className="ss-confirmation-message">{message}</p>
          {error && <p className="ss-error" role="alert">{error}</p>}
          {isAwaitingPayment && <button type="button" className="button dark ss-confirmation-pay" disabled={paying} onClick={async () => {
            setPaying(true); setError('');
            try { setOrder(await payWithRazorpay(order._id)); } catch (error) { setError(error instanceof Error ? error.message : 'Could not complete payment.'); }
            finally { setPaying(false); }
          }}>{paying ? 'Opening payment…' : 'Pay ' + price(order.total, order.currency)}</button>}
          {order.paymentMethod === 'razorpay' && !isPaid && <button type="button" className="ss-text-button" disabled={paying} onClick={() => setRetry(value => value + 1)}>Refresh payment status</button>}
          <div className="ss-confirmation-actions">
            <Link className="button dark" href={exclusiveLink({ orders: 1 })}>View my orders <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="button outline" href={exclusiveLink()}>Continue shopping</Link>
          </div>
        </div>
        <div className="ss-confirmation-ticket" aria-label="Order receipt">
          <div><span>ORDER NUMBER</span><strong className="ss-order-number">{order.number}</strong></div>
          <div><span>{isPaid ? 'AMOUNT PAID' : isCOD && !isCancelled ? 'PAY ON DELIVERY' : 'ORDER TOTAL'}</span><strong>{price(order.total, order.currency)}</strong></div>
        </div>
      </div>
      <div className="ss-confirmation-details">
      <div className="ss-checkout-panel">
        <h2><ShoppingBag size={18} aria-hidden="true" />Your items</h2>
        <ul className="ss-review-items">
          {order.items.map((item) => (
            <li key={item.variantId}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {[item.color, item.size].filter(Boolean).join(' · ')} · Qty{' '}
                  {item.quantity}
                </span>
              </div>
              <span>{price(item.lineTotal, order.currency)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ss-checkout-panel">
        <h2><MapPin size={18} aria-hidden="true" />Delivery & payment</h2>
        <span className="ss-confirmation-label">DELIVER TO</span>
        <address>
          <strong>{order.shippingAddress.recipientName}</strong>
          <span>
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2
              ? ', ' + order.shippingAddress.addressLine2
              : ''}
          </span>
          <span>
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
          </span>
        </address>
        <span className="ss-confirmation-label ss-confirmation-payment-label">PAYMENT METHOD</span>
        <p className="ss-confirmation-payment-method">{isCOD ? 'Cash on delivery' : order.paymentMethod === 'razorpay' ? 'Razorpay' : 'No payment required'}</p>
        <dl className="ss-confirmation-totals">
          <div>
            <dt>Items</dt>
            <dd>{price(order.subtotal, order.currency)}</dd>
          </div>
          {!!order.discount && <div><dt>Coupon {order.coupon?.code}</dt><dd>−{price(order.discount, order.currency)}</dd></div>}
          <div>
            <dt>Delivery</dt>
            <dd>{price(order.shipping, order.currency)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{price(order.total, order.currency)}</dd>
          </div>
        </dl>
      </div>
      </div>
      {['confirmed', 'processing'].includes(order.status) && ['cod', 'free'].includes(order.paymentMethod) && (order.paymentStatus === 'unpaid' || order.total === 0) && <div className="ss-order-cancel">{confirmCancel ? <div className="ss-checkout-panel"><h2>Cancel this order?</h2><p>This cancels the entire order.</p><div className="ss-address-form-actions"><button type="button" className="button outline" disabled={cancelling} onClick={() => setConfirmCancel(false)}>Keep order</button><button type="button" className="button dark" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></div></div> : <button type="button" className="ss-text-button" onClick={() => setConfirmCancel(true)}>Cancel order</button>}</div>}
    </section>
  );
}
