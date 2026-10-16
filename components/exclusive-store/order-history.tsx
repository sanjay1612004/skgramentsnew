'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import {
  StoreApiError,
  storeRequest,
  exclusiveLink,
  price,
  type Order,
} from '@/lib/store-api';

type OrderSummary = Pick<
  Order,
  '_id' | 'number' | 'status' | 'currency' | 'total' | 'createdAt'
> & { items: { name: string; quantity: number }[] };
type OrderList = {
  data: OrderSummary[];
  pagination: { page: number; pages: number; total: number };
};
export default function OrderHistory({
  page,
  onExpired,
}: {
  page: number;
  onExpired: () => void;
}) {
  const [result, setResult] = useState<OrderList | null>(null);
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
  useEffect(() => {
    const controller = new AbortController();
    storeRequest<OrderList>(
      '/orders?' + new URLSearchParams({ page: String(page), limit: '10' }),
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
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
              : 'Could not load your orders.',
          );
      });
    return () => controller.abort();
  }, [page, onExpired, retry]);
  return (
    <section className="ss-catalog ss-orders" aria-label="Your orders">
      <div className="ss-bag-heading">
        <h1>Your orders</h1>
      </div>
      {error ? (
        <div className="ss-error" role="alert">
          {error}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      ) : !result ? (
        <p className="ss-bag-loading" role="status">
          Loading your orders…
        </p>
      ) : (
        <>
          {result.data.length ? (
            <div className="ss-order-list">
              {result.data.map((order) => {
                const count = order.items.reduce(
                  (total, item) => total + item.quantity,
                  0,
                );
                return (
                  <Link
                    key={order._id}
                    href={exclusiveLink({ order: order._id })}
                    className="ss-order-card"
                    aria-label={'View order ' + order.number}
                  >
                    <div className="ss-order-card-top">
                      <strong>{order.number}</strong>
                      <span
                        className="ss-order-status"
                        data-status={order.status}
                      >
                        {order.status}
                      </span>
                    </div>
                    <time dateTime={order.createdAt}>
                      {new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'Asia/Kolkata',
                      }).format(new Date(order.createdAt))}
                    </time>
                    <p>
                      {order.items
                        .slice(0, 2)
                        .map((item) => item.name)
                        .join(', ')}
                      {order.items.length > 2
                        ? ` +${order.items.length - 2} more`
                        : ''}
                    </p>
                    <div className="ss-order-card-bottom">
                      <span>
                        {count} {count === 1 ? 'item' : 'items'} ·{' '}
                        {price(order.total, order.currency)}
                      </span>
                      <span>
                        View order
                        <ChevronRight size={16} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="ss-empty ss-bag-empty">
              <Package size={30} aria-hidden="true" />
              <h2>{page > 1 ? 'No orders on this page' : 'No orders yet'}</h2>
              <p>
                {page > 1
                  ? 'Use the previous page to see your orders.'
                  : 'Your orders will appear here after checkout.'}
              </p>
            </div>
          )}
          {(result.pagination.pages > 1 || page > 1) && (
            <nav className="ss-pagination" aria-label="Order pages">
              {page > 1 ? (
                <Link
                  className="button outline"
                  href={exclusiveLink({ orders: 1, page: page - 1 })}
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span>Page {page}</span>
              {page < result.pagination.pages ? (
                <Link
                  className="button outline"
                  href={exclusiveLink({ orders: 1, page: page + 1 })}
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}
