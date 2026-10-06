import type { Metadata } from 'next';
import { site } from '@/data/site';

export const homeTitle = 'Bulk T-Shirt Orders & Wholesale in Tiruppur | SK GARMENTS';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${site.name}`, description, url: path, type: 'website', siteName: site.name, locale: 'en_IN' },
    twitter: { card: 'summary', title: `${title} | ${site.name}`, description },
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export const businessId = `${site.origin}/#business`;
export const websiteId = `${site.origin}/#website`;

export function businessStructuredData() {
  const digits = site.contact.phone.replace(/\D/g, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore', '@id': businessId,
    name: site.name, url: `${site.origin}/`, description: site.description,
    foundingDate: String(site.about.establishedYear),
    telephone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
    email: site.contact.email,
    image: [`${site.origin}/images/shop/shop1.webp`, `${site.origin}/images/shop/shop2.webp`],
    address: { '@type': 'PostalAddress', streetAddress: site.contact.address, addressLocality: 'Tiruppur', addressRegion: 'Tamil Nadu', postalCode: '641603', addressCountry: 'IN' },
    hasMap: site.contact.mapsUrl,
    sameAs: [site.contact.instagram].filter(Boolean),
  };
}
