'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LockKeyhole } from 'lucide-react';
import { StoreApiError, storeRequest, exclusiveLink, price, stockAvailability, type Category, type ProductList } from '@/lib/store-api';

type State = { loading: boolean; error: string; categories: Category[]; category?: Category; list?: ProductList };
export default function ExclusiveCatalog({ category, page, onExpired }: { category: string; page: number; onExpired: () => void }) {
  const [state, setState] = useState<State>({ loading: true, error: '', categories: [] });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        if (category) {
          const [collection, list] = await Promise.all([
            storeRequest<{ category: Category }>('/exclusive-store/categories/' + encodeURIComponent(category), { signal: controller.signal }),
            storeRequest<ProductList>('/exclusive-store/products?' + new URLSearchParams({ category, page: String(page), limit: '12' }), { signal: controller.signal }),
          ]);
          if (!controller.signal.aborted) setState({ loading: false, error: '', categories: [], category: collection.category, list });
        } else {
          const result = await storeRequest<{ data: Category[] }>('/exclusive-store/categories', { signal: controller.signal });
          if (!controller.signal.aborted) setState({ loading: false, error: '', categories: result.data });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof StoreApiError && error.status === 401) { onExpired(); return; }
        setState({ loading: false, categories: [], error: error instanceof Error ? error.message : 'Could not load this collection.' });
      }
    };
    void load();
    return () => controller.abort();
  }, [category, page, retry, onExpired]);
  if (state.loading) return <div className="ss-loading" role="status">Finding the pieces…</div>;
  if (state.error) return <section className="ss-message" role="alert"><p>{state.error}</p><button className="button dark" onClick={() => setRetry((value) => value + 1)}>Try again</button></section>;

  return <section className="ss-catalog" aria-label={category ? 'Exclusive products' : 'Exclusive collections'}>
    {category && <div className="ss-section-top ss-category-heading"><div><h2>{state.category?.name}</h2>{state.category?.description && <p>{state.category.description}</p>}</div></div>}
    {category ? <>
      {state.list?.data.length ? <div className="ss-products">{state.list.data.map((product) => {
        const image = product.images.find((item) => item.isPrimary) || product.images[0];
        const stock = stockAvailability(product.variants);
        return <Link key={product._id} href={exclusiveLink({ category, product: product.slug })} className="ss-product-card"><div className="ss-product-image">{image ? <Image width={600} height={800} src={image.url} alt={image.altText || product.name} loading="lazy" /> : <span>SK</span>}</div><div className="ss-product-copy">{product.brand && <span className="ss-product-brand">{product.brand}</span>}<h3>{product.name}</h3><p className="ss-card-price">{price(product.priceRange?.minimum, product.variants[0]?.pricing.currency)}</p><p className="ss-stock" data-available={stock.available}>{stock.label}</p></div></Link>;
      })}</div> : <p className="ss-empty">No pieces on this page. Browse another page or collection.</p>}
      {state.list && state.list.pagination.pages > 1 && <nav className="ss-pagination" aria-label="Product pages">{page > 1 ? <Link className="button outline" href={exclusiveLink({ category, page: page - 1 })}>Previous</Link> : <span />}<span>Page {page} of {state.list.pagination.pages}</span>{page < state.list.pagination.pages ? <Link className="button outline" href={exclusiveLink({ category, page: page + 1 })}>Next</Link> : <span />}</nav>}
    </> : state.categories.length ? <div className="ss-collections">{state.categories.map((item) => <Link href={exclusiveLink({ category: item.slug })} key={item._id} className="ss-collection-card"><div className="ss-collection-image">{item.image?.url ? <Image unoptimized width={120} height={120} src={item.image.url} alt={item.image.altText || ''} loading="lazy" /> : <span aria-hidden="true">{item.name.slice(0, 1)}</span>}</div><div className="ss-collection-copy"><h3>{item.name}</h3></div></Link>)}</div> : <div className="ss-empty"><LockKeyhole size={30} aria-hidden="true" /><h3>Something special is on its way.</h3><p>Our exclusive collections are being prepared. Come back soon for the first pieces.</p></div>}
  </section>;
}
