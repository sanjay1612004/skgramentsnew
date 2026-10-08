import type { Metadata } from 'next';
import { site } from '@/data/site';

export const homeTitle = `${site.name} | Bulk T-Shirts & Wholesale in Tiruppur`;

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

export function homeStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': websiteId,
        name: site.name, alternateName: site.alternateNames,
        url: `${site.origin}/`, inLanguage: 'en-IN',
        publisher: { '@id': businessId },
      },
      {
        '@type': 'WebPage', '@id': `${site.origin}/#page`,
        name: homeTitle, description: site.description, url: `${site.origin}/`,
        inLanguage: 'en-IN', isPartOf: { '@id': websiteId },
        about: { '@id': businessId }, mainEntity: { '@id': businessId },
      },
    ],
  };
}

export function businessStructuredData() {
  const digits = site.contact.phone.replace(/\D/g, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore', '@id': businessId,
    name: site.name, alternateName: site.alternateNames,
    url: `${site.origin}/`, description: site.description,
    foundingDate: String(site.about.establishedYear),
    telephone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
    email: site.contact.email,
    image: [`${site.origin}/images/shop/shop1.webp`, `${site.origin}/images/shop/shop2.webp`],
    address: { '@type': 'PostalAddress', streetAddress: site.contact.address, addressLocality: 'Tiruppur', addressRegion: 'Tamil Nadu', postalCode: '641603', addressCountry: 'IN' },
    hasMap: site.contact.mapsUrl,
    sameAs: [site.contact.instagram].filter(Boolean),
  };
}
