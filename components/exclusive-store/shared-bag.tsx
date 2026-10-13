'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { StoreApiError, storeRequest, exclusiveLink, price, type Cart } from '@/lib/store-api';

export default function SharedBag({ onExpired }: { onExpired: () => void }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    storeRequest<{ cart: Cart }>('/cart', { signal: controller.signal }).then((result) => { if (!controller.signal.aborted) { setCart(result.cart); setError(''); } }).catch((error) => {
      if (controller.signal.aborted) return;
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else setError(error instanceof Error ? error.message : 'Could not load your bag.');
    });
    return () => controller.abort();
  }, [retry, onExpired]);
  async function change(variantId: string, quantity?: number) {
    if (busy) return;
    setBusy(variantId); setError('');
    try {
      const result = await storeRequest<{ cart: Cart }>('/cart/items/' + encodeURIComponent(variantId), { method: quantity === undefined ? 'DELETE' : 'PATCH', ...(quantity === undefined ? {} : { body: JSON.stringify({ quantity }) }) });
      setCart(result.cart);
    } catch (error) { if (error instanceof StoreApiError && error.status === 401) onExpired(); else setError(error instanceof Error ? error.message : 'Could not update your bag.'); }
    finally { setBusy(''); }
  }
  return <section className="ss-catalog"><div className="ss-section-top"><div><span className="ss-kicker">SAME ACCOUNT / SAME BAG</span><h2>YOUR BAG.</h2></div></div>{error && <div className="ss-error" role="alert">{error}<button onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
    {!cart ? !error && <p role="status">Loading your bag…</p> : cart.items.length ? <div className="ss-bag-layout"><div>{cart.items.map((item) => <article key={item.variantId} className="ss-bag-item"><div className="ss-bag-image">{item.product?.image && <Image width={600} height={800} src={item.product.image.url} alt={item.product.name} />}</div><div><h3>{item.product?.isSecret ? <Link href={exclusiveLink({ product: item.product.slug })}>{item.product.name}</Link> : item.product?.name || 'Unavailable product'}</h3><p>{item.variant?.options?.color?.name || 'Standard'} / {item.variant?.options?.size || 'One size'}</p><strong>{price(item.lineTotal, item.currency)}</strong>{item.issue && <p className="ss-error">{item.issue.message}</p>}<div className="ss-quantity"><button disabled={Boolean(busy) || item.quantity <= 1} aria-label={'Decrease quantity of ' + item.product?.name} onClick={() => change(item.variantId, item.quantity - 1)}><Minus size={16} /></button><span>{item.quantity}</span><button disabled={Boolean(busy) || !item.available || item.quantity >= item.maxQuantity} aria-label={'Increase quantity of ' + item.product?.name} onClick={() => change(item.variantId, item.quantity + 1)}><Plus size={16} /></button><button disabled={Boolean(busy)} aria-label={'Remove ' + item.product?.name} onClick={() => change(item.variantId)}><Trash2 size={16} /></button></div></div></article>)}</div><aside className="ss-bag-summary"><span className="ss-kicker">YOUR SHARED BAG</span><h3>{cart.summary.itemCount} items</h3><div><span>Subtotal</span><strong>{price(cart.summary.subtotal, cart.summary.currency || 'INR')}</strong></div><p className="ss-help">Your bag is also available in our store. Shipping and payment are arranged separately.</p></aside></div> : <div className="ss-empty"><h3>Your bag is waiting for its first piece.</h3><Link href={exclusiveLink()} className="button dark">Explore the collections</Link></div>}
  </section>;
}
