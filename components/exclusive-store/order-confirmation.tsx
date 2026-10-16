'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  StoreApiError,
  storeRequest,
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
  return (
    <section className="ss-catalog ss-order-confirmation">
      <div className="ss-order-check">
        <Check size={28} aria-hidden="true" />
      </div>
      <h1>{headings[order.status] || 'Your order'}</h1>
      <p className="ss-order-number">{order.number}</p>
      {error && <p className="ss-error" role="alert">{error}</p>}
      <p>
        {order.status === 'cancelled'
          ? 'This order has been cancelled.'
          : order.total === 0
            ? 'No payment is required.'
            : order.paymentStatus === 'paid'
            ? (order.status === 'payment_review' ? 'Payment received. The store will contact you to confirm availability or arrange a refund.' : 'Payment received.')
            : order.paymentMethod === 'razorpay' ? 'Your order is awaiting online payment. Stock is confirmed after payment.' : order.status === 'delivered'
              ? `Payment due: ${price(order.total, order.currency)}.`
              : `Pay ${price(order.total, order.currency)} on delivery.`}
      </p>
      {order.status === 'awaiting_payment' && <button type="button" className="button dark" disabled={paying} onClick={async () => {
        setPaying(true); setError('');
        try { setOrder(await payWithRazorpay(order._id)); } catch (error) { setError(error instanceof Error ? error.message : 'Could not complete payment.'); }
        finally { setPaying(false); }
      }}>{paying ? 'Opening payment…' : 'Pay ' + price(order.total, order.currency)}</button>}
      {order.paymentMethod === 'razorpay' && <button type="button" className="ss-text-button" disabled={paying} onClick={() => setRetry(value => value + 1)}>Refresh payment status</button>}
      <div className="ss-checkout-panel">
        <h2>Your items</h2>
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
        <h2>Delivery address</h2>
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
      {['confirmed', 'processing'].includes(order.status) && order.paymentMethod === 'cod' && (order.paymentStatus === 'unpaid' || order.total === 0) && <div className="ss-order-cancel">{confirmCancel ? <div className="ss-checkout-panel"><h2>Cancel this order?</h2><p>This cancels the entire order.</p><div className="ss-address-form-actions"><button type="button" className="button outline" disabled={cancelling} onClick={() => setConfirmCancel(false)}>Keep order</button><button type="button" className="button dark" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></div></div> : <button type="button" className="ss-text-button" onClick={() => setConfirmCancel(true)}>Cancel order</button>}</div>}
    </section>
  );
}
