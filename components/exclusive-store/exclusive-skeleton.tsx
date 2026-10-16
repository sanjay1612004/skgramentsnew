type SkeletonVariant = 'opening' | 'invitation' | 'categories' | 'products';

const labels: Record<SkeletonVariant, string> = {
  opening: 'Opening the Exclusive Store…',
  invitation: 'Checking your invitation…',
  categories: 'Loading collections…',
  products: 'Loading products…',
};

function Line({ width, className = '' }: { width: string; className?: string }) {
  return <span className={`ss-skeleton-line ${className}`} style={{ width }} />;
}

export default function ExclusiveSkeleton({ variant }: { variant: SkeletonVariant }) {
  return <div className={`ss-skeleton ss-skeleton-${variant}`} role="status">
    <span className="sr-only">{labels[variant]}</span>
    <div aria-hidden="true">
      {variant === 'invitation' ? <div className="ss-auth"><div className="ss-auth-panel ss-skeleton-auth">
        <Line width="72%" className="ss-skeleton-title" />
        <Line width="92%" /><Line width="68%" />
        <div className="ss-skeleton-field"><Line width="27%" /><Line width="100%" className="ss-skeleton-input" /></div>
        <div className="ss-skeleton-field"><Line width="38%" /><Line width="100%" className="ss-skeleton-input" /></div>
        <Line width="100%" className="ss-skeleton-button" />
      </div></div> : variant === 'opening' ? <div className="ss-catalog ss-skeleton-opening-content">
        <Line width="44%" className="ss-skeleton-title" />
        <Line width="70%" />
        <div className="ss-skeleton-opening-row"><Line width="100%" /><Line width="100%" /></div>
      </div> : <section className="ss-catalog">
        {variant === 'products' && <div className="ss-skeleton-heading"><Line width="38%" className="ss-skeleton-title" /><Line width="57%" /></div>}
        {variant === 'categories' ? <div className="ss-collections">
          {Array.from({ length: 6 }, (_, index) => <div className="ss-collection-card ss-skeleton-collection" key={index}>
            <div className="ss-skeleton-line ss-collection-image" />
            <div className="ss-collection-copy"><Line width={index % 2 ? '64%' : '80%'} /></div>
          </div>)}
        </div> : <div className="ss-products">
          {Array.from({ length: 4 }, (_, index) => <div className="ss-product-card ss-skeleton-product" key={index}>
            <div className="ss-product-image ss-skeleton-line" />
            <div className="ss-product-copy"><Line width="38%" /><Line width="85%" /><Line width="58%" /><Line width="46%" /></div>
          </div>)}
        </div>}
      </section>}
    </div>
  </div>;
}
