import sitemap from '@/app/sitemap';
import { collections } from '@/data/collections';
import { products } from '@/data/products';
import { site } from '@/data/site';

export const dynamic = 'force-static';

// Initial publication of these feed entries. Advance when their content changes,
// rather than reporting a new content update on every deployment.
const updated = '2026-10-08T11:12:33Z';

const escapeXml = (value: string) => value.replace(/[<>&"']/g, character => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
}[character]!));

export function GET() {
  const descriptions = new Map<string, { title: string; summary: string }>([
    ['/', { title: site.name, summary: site.description }],
    ['/bulk-tshirt-orders/', {
      title: `Bulk T-Shirt Orders | ${site.name}`,
      summary: 'Bulk T-shirts, wholesale garments and custom printing enquiries in Tiruppur.',
    }],
    ['/jersey-t-shirt-for-jallikattu/', {
      title: `Jallikattu Jerseys | ${site.name}`,
      summary: 'Explore Jallikattu jersey concepts with bull artwork and enquire about custom team orders.',
    }],
    ...products.map(product => [
      `/products/${product.slug}/`,
      { title: product.name, summary: product.description },
    ] as [string, { title: string; summary: string }]),
    ...collections.map(collection => [
      `/collections/${collection.slug}/`,
      { title: collection.name, summary: collection.description },
    ] as [string, { title: string; summary: string }]),
  ]);

  const entries = sitemap().map(({ url }) => {
    const page = descriptions.get(new URL(url).pathname);
    return `  <entry>
    <id>${escapeXml(url)}</id>
    <title type="text">${escapeXml(page?.title ?? site.name)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(url)}" />
    <updated>${updated}</updated>
    <summary type="text">${escapeXml(page?.summary ?? site.description)}</summary>
  </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-IN">
  <id>${escapeXml(`${site.origin}/atom.xml`)}</id>
  <title type="text">${escapeXml(site.name)}</title>
  <subtitle type="text">${escapeXml(site.description)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(`${site.origin}/atom.xml`)}" />
  <link rel="alternate" type="text/html" href="${escapeXml(`${site.origin}/`)}" />
  <updated>${updated}</updated>
  <author><name>${escapeXml(site.name)}</name><uri>${escapeXml(`${site.origin}/`)}</uri></author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}
