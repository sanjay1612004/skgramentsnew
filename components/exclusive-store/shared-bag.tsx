'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { exclusiveLink, price } from '@/lib/store-api';
import type { StoreCart } from './use-store-cart';

export default function SharedBag({ resource }: { resource: StoreCart }) {
  const { cart, error, busy, loading, refresh, changeItem } = resource;
  useEffect(() => {
    void refresh(true);
  }, [refresh]);
  const itemCount = cart?.summary.itemCount || 0;
  return (
    <section className="ss-catalog ss-bag" aria-label="Shopping bag">
      <div className="ss-bag-heading">
        <h1>Your bag</h1>
        {cart && (
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      {error && (
        <div className="ss-error" role="alert">
          {error}
          <button
            type="button"
            disabled={Boolean(busy) || loading}
            onClick={() => void refresh()}
          >
            Refresh bag
          </button>
        </div>
      )}
      {!cart ? (
        !error && (
          <p className="ss-bag-loading" role="status">
            Loading your bag…
          </p>
        )
      ) : cart.items.length ? (
        <div className="ss-bag-layout">
          <div className="ss-bag-items" aria-busy={Boolean(busy) || loading}>
            {cart.items.map((item) => {
              const name = item.product?.name || 'Unavailable product';
              const changing = busy === item.variantId;
              return (
                <article
                  key={item.variantId}
                  className="ss-bag-item"
                  aria-label={name}
                >
                  <div className="ss-bag-image">
                    {item.product?.image ? (
                      <Image
                        width={160}
                        height={200}
                        src={item.product.image.url}
                        alt={item.product.image.altText || name}
                        sizes="(max-width: 700px) 80px, 96px"
                      />
                    ) : (
                      <ShoppingBag size={24} aria-hidden="true" />
                    )}
                  </div>
                  <div className="ss-bag-item-copy">
                    <h2>
                      {item.product?.isSecret ? (
                        <Link
                          href={exclusiveLink({ product: item.product.slug })}
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </h2>
                    <p className="ss-bag-option">
                      {item.variant?.options?.color?.name || 'Standard'} ·{' '}
                      {item.variant?.options?.size || 'One size'}
                    </p>
                    <div className="ss-bag-price">
                      <strong>
                        {price(
                          item.lineTotal ?? undefined,
                          item.currency || 'INR',
                        )}
                      </strong>
                      {item.quantity > 1 && (
                        <small>
                          {price(
                            item.unitPrice ?? undefined,
                            item.currency || 'INR',
                          )}{' '}
                          each
                        </small>
                      )}
                    </div>
                    {item.issue && (
                      <p className="ss-bag-issue" role="status">
                        {item.issue.message}
                      </p>
                    )}
                    <div className="ss-bag-actions">
                      <div
                        className="ss-quantity"
                        aria-label={'Quantity for ' + name}
                      >
                        <button
                          type="button"
                          disabled={
                            Boolean(busy) ||
                            loading ||
                            item.quantity <= 1 ||
                            item.maxQuantity < 1
                          }
                          aria-label={'Decrease quantity of ' + name}
                          onClick={() =>
                            void changeItem(
                              item.variantId,
                              Math.min(item.quantity - 1, item.maxQuantity),
                            ).catch(() => {})
                          }
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={
                            Boolean(busy) ||
                            loading ||
                            !item.available ||
                            item.quantity >= item.maxQuantity
                          }
                          aria-label={'Increase quantity of ' + name}
                          onClick={() =>
                            void changeItem(
                              item.variantId,
                              item.quantity + 1,
                            ).catch(() => {})
                          }
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ss-bag-remove"
                        disabled={Boolean(busy) || loading}
                        aria-label={'Remove ' + name}
                        onClick={() =>
                          void changeItem(item.variantId).catch(() => {})
                        }
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        <span>Remove</span>
                      </button>
                    </div>
                    {changing && (
                      <span className="ss-bag-updating" role="status">
                        Updating…
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="ss-bag-summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>
                  {price(cart.summary.subtotal, cart.summary.currency || 'INR')}
                </dd>
              </div>
              {cart.summary.discountTotal > 0 && (
                <div className="ss-bag-savings">
                  <dt>You save</dt>
                  <dd>
                    {price(
                      cart.summary.discountTotal,
                      cart.summary.currency || 'INR',
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt>Delivery</dt>
                <dd>At checkout</dd>
              </div>
            </dl>
            {cart.summary.checkoutEligible && !busy && !loading && !error ? (
              <Link
                href={exclusiveLink({ checkout: 1 })}
                className="button dark full"
              >
                Continue to checkout
              </Link>
            ) : (
              <button type="button" className="button dark full" disabled>
                Continue to checkout
              </button>
            )}
            {!cart.summary.checkoutEligible && (
              <p className="ss-help">
                Update or remove unavailable items to continue.
              </p>
            )}
            <p className="ss-help">
              Items are confirmed when you place your order.
            </p>
          </aside>
        </div>
      ) : (
        <div className="ss-empty ss-bag-empty">
          <ShoppingBag size={32} aria-hidden="true" />
          <h2>Your bag is empty</h2>
          <p>Choose something you love from the collection.</p>
          <Link href={exclusiveLink()} className="button dark">
            Explore the collection
          </Link>
        </div>
      )}
    </section>
  );
}
