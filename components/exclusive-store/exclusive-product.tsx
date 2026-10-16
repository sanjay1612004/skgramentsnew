'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { StoreApiError, storeRequest, exclusiveLink, price, available, stockAvailability, type Product, type Cart } from '@/lib/store-api';

export default function ExclusiveProduct({ identifier, onExpired, onAdd, cartBusy }: { identifier: string; onExpired: () => void; onAdd: (variantId: string) => Promise<Cart>; cartBusy: boolean }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [variantId, setVariantId] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    storeRequest<Product>('/exclusive-store/products/' + encodeURIComponent(identifier), { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      setProduct(result); setError(''); setVariantId(''); setAdded(false); setImageIndex(0);
      if (result.variants.length === 1 && available(result.variants[0])) setVariantId(result.variants[0]._id);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      if (error instanceof StoreApiError && error.status === 401) { onExpired(); return; }
      setError(error instanceof Error ? error.message : 'Could not load this product.');
    });
    return () => controller.abort();
  }, [identifier, retry, onExpired]);
  const variant = product?.variants.find((item) => item._id === variantId);
  async function addToBag() {
    if (!variant || !available(variant) || busy || cartBusy) return;
    setBusy(true); setError(''); setAdded(false);
    try { await onAdd(variantId); setAdded(true); }
    catch (error) { if (error instanceof StoreApiError && error.status === 401) onExpired(); else setError(error instanceof Error ? error.message : 'Could not add to your bag.'); }
    finally { setBusy(false); }
  }
  if (!product) return error ? <section className="ss-message" role="alert"><p>{error}</p><button className="button dark" onClick={() => setRetry((value) => value + 1)}>Try again</button></section> : <div className="ss-loading" role="status">Opening your piece…</div>;
  const image = product.images[imageIndex];
  const soldOut = !product.variants.some(available);
  const stock = stockAvailability(variant ? [variant] : product.variants);
  const amount = variant?.pricing.price ?? product.priceRange?.minimum;
  const currency = variant?.pricing.currency || product.variants[0]?.pricing.currency;
  const compareAt = variant?.pricing.compareAtPrice;
  function changeImage(direction: number) {
    setImageIndex((index) => (index + direction + product!.images.length) % product!.images.length);
  }
  return <section className="ss-detail">
    <div className="ss-detail-grid">
      <div className="ss-gallery">
        <div className="ss-detail-image">
          {image ? <Image width={600} height={800} src={image.url} alt={image.altText || product.name} sizes="(max-width: 700px) 100vw, 50vw" /> : <span>Image coming soon</span>}
          {product.images.length > 1 && <div className="ss-gallery-controls"><button type="button" aria-label="Previous product image" onClick={() => changeImage(-1)}><ChevronLeft size={20} aria-hidden="true" /></button><span aria-live="polite">{imageIndex + 1} / {product.images.length}</span><button type="button" aria-label="Next product image" onClick={() => changeImage(1)}><ChevronRight size={20} aria-hidden="true" /></button></div>}
        </div>
        {product.images.length > 1 && <div className="ss-thumbnails" aria-label="Product images">{product.images.map((item, index) => <button key={item.url + index} aria-label={`View product image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><Image width={80} height={100} src={item.url} alt="" loading="lazy" /></button>)}</div>}
      </div>
      <div className="ss-detail-copy">
        <div className="ss-product-heading">{product.brand && <p className="ss-product-brand">{product.brand}</p>}<h1>{product.name}</h1><div className="ss-price-row"><p className="ss-detail-price">{price(amount, currency)}</p>{compareAt !== undefined && amount !== undefined && compareAt > amount && <del>{price(compareAt, currency)}</del>}</div><p className="ss-stock" data-available={stock.available} aria-live="polite">{stock.label}{!variant && product.variants.length > 1 && stock.available ? ' across all options' : ''}</p></div>
        <p className="ss-short-description">{product.shortDescription}</p>
        <fieldset className="ss-options"><legend>Colour & size</legend><div className="ss-option-grid">{product.variants.map((item) => <button type="button" key={item._id} disabled={!available(item) || busy} aria-pressed={variantId === item._id} onClick={() => { setVariantId(item._id); setAdded(false); setError(''); }}><span>{item.options?.color?.name || 'Standard'} / {item.options?.size || item.title || 'One size'}</span><small>{stockAvailability([item]).label}</small></button>)}</div></fieldset>
        {soldOut && <p className="ss-help">This piece is currently sold out.</p>}
        {error && <p className="ss-error" role="alert">{error}</p>}
        {!variant && !soldOut && <p className="ss-help">Choose an available option to add this piece.</p>}
        {added && <p className="ss-success" role="status">Added to your bag. <Link href={exclusiveLink({ bag: 1 })}>View your bag →</Link></p>}
        <div className="ss-purchase"><div className="ss-purchase-price"><span>{price(amount, currency)}</span><small>{variant ? `${variant.options?.color?.name || 'Standard'} / ${variant.options?.size || variant.title || 'One size'}` : soldOut ? 'Sold out' : 'Choose an option'}</small></div><button type="button" className="button dark full" disabled={!variant || !available(variant) || busy || cartBusy} onClick={addToBag}><ShoppingBag size={18} aria-hidden="true" />{busy ? 'Adding…' : soldOut ? 'Sold out' : 'Add to your bag'}</button></div>
        <details className="ss-description"><summary>Product details</summary><p>{product.description}</p></details>
      </div>
    </div>
  </section>;
}
