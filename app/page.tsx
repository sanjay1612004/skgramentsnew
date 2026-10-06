import Home from '@/components/home';
import type { Metadata } from 'next';
import BulkOrdersSummary from '@/components/bulk-orders-summary';
import { site } from '@/data/site';
import { homeTitle, jsonLd, websiteId, businessId } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: homeTitle }, description: site.description,
  alternates: { canonical: '/' },
  openGraph: { title: homeTitle, description: site.description, url: '/', type: 'website', siteName: site.name, locale: 'en_IN' },
  twitter: { card: 'summary', title: homeTitle, description: site.description },
};

export default function Page() {
  return <><Home><BulkOrdersSummary /></Home><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': websiteId, name: site.name, url: `${site.origin}/`, inLanguage: 'en-IN', publisher: { '@id': businessId } }) }} /></>;
}
