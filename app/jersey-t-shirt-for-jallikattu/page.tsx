import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/static-link';
import JallikattuAnimations from '@/components/jallikattu-animations';
import { site } from '@/data/site';
import { businessId, jsonLd, pageMetadata, websiteId } from '@/lib/seo';
import './jallikattu.css';

const path = '/jersey-t-shirt-for-jallikattu/';
const title = 'Jallikattu Jersey T-Shirts & Bull Print Designs';
const description = 'Explore Jallikattu jersey T-shirts with bold Tamil bull artwork. Discover custom team names, colours and print ideas from THE SK APPARELS in Tiruppur, Tamil Nadu.';
const imageRoot = '/images/jallikattu';

export const metadata: Metadata = {
  ...pageMetadata(title, description, path),
  openGraph: {
    title: `${title} | ${site.name}`, description, url: path,
    type: 'website', siteName: site.name, locale: 'en_IN',
    images: [{ url: `${imageRoot}/jallikattu-jersey-social.webp`, width: 1200, height: 630, alt: 'Black Jallikattu jersey with gold Tamil bull artwork by THE SK APPARELS' }],
  },
  twitter: {
    card: 'summary_large_image', title, description,
    images: [`${imageRoot}/jallikattu-jersey-social.webp`],
  },
};

const designs = [
  { name: 'The signature bull', colour: 'CHARCOAL / ANTIQUE GOLD', image: 'jallikattu-black-bull-jersey', alt: 'Black Jallikattu jersey T-shirt with a large gold native bull illustration and gold collar trim', text: 'A striking bull illustration against deep charcoal. Quiet detailing. A strong presence.' },
  { name: 'Rooted in tradition', colour: 'WARM IVORY / EARTH', image: 'jallikattu-ivory-bull-jersey', alt: 'Ivory Jallikattu jersey T-shirt featuring earthy Tamil bull artwork', text: 'Warm ivory meets earthy artwork in a lighter expression of the same proud identity.' },
  { name: 'A bolder expression', colour: 'DEEP MAROON / SAND', image: 'jallikattu-maroon-bull-jersey', alt: 'Maroon Jallikattu jersey T-shirt with sand-coloured bull artwork', text: 'Rich maroon and sand tones bring a distinctive character to a coordinated team look.' },
];

const faqs = [
  { question: 'What is a Jallikattu jersey T-shirt?', answer: 'A Jallikattu jersey T-shirt is a sportswear-inspired garment featuring artwork connected to Jallikattu, often a native Tamil bull, Tamil lettering or a team identity. This collection explores those ideas through contemporary jersey designs.' },
  { question: 'Can a Jallikattu bull image be printed on a jersey?', answer: 'Bull artwork can be discussed as part of a custom jersey design. The size, colours, placement and printing method depend on the chosen garment and the detail in your image. Final artwork is confirmed before production.' },
  { question: 'Can the design include Tamil text, team names and numbers?', answer: 'Customisation can include your preferred Tamil or English lettering, a team or village name, and individual names or numbers. Spelling, type style and placement are reviewed with the artwork so the design feels consistent across the team.' },
  { question: 'Does THE SK APPARELS handle bulk Jallikattu jersey enquiries?', answer: 'THE SK APPARELS in Tiruppur handles bulk garment and custom-print enquiries. Quantity, size breakdown, fabric, artwork and your required date help define a Jallikattu team order. Minimum quantities, prices and delivery arrangements are confirmed for each enquiry.' },
];

export default function JallikattuPage() {
  const url = `${site.origin}${path}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', '@id': `${url}#page`, url, name: title, description,
        inLanguage: 'en-IN', isPartOf: { '@id': websiteId }, publisher: { '@id': businessId },
        about: { '@type': 'Thing', name: 'Jallikattu jersey T-shirts with Tamil bull artwork' },
        primaryImageOfPage: { '@id': `${url}#hero-image` },
        breadcrumb: { '@id': `${url}#breadcrumbs` },
      },
      {
        '@type': 'ImageObject', '@id': `${url}#hero-image`,
        contentUrl: `${site.origin}${imageRoot}/jallikattu-black-bull-jersey.webp`,
        name: 'Jallikattu bull artwork jersey design',
        caption: 'Jallikattu jersey design concept in charcoal and antique gold by THE SK APPARELS.',
        representativeOfPage: true,
      },
      {
        '@type': 'Service', '@id': `${url}#custom-jerseys`,
        name: 'Custom Jallikattu jersey T-shirt enquiries',
        serviceType: 'Custom jersey artwork and bulk garment enquiries',
        description: 'Jallikattu jersey and T-shirt design enquiries with bull artwork, team names, Tamil lettering and custom colours.',
        url, provider: { '@id': businessId },
      },
      {
        '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Jallikattu jerseys', item: url },
        ],
      },
    ],
  };

  return (
    <main id="main" className="jk-page">
      <section className="jk-hero" aria-labelledby="jk-title">
        <div className="jk-hero-copy">
          <nav aria-label="Breadcrumb" className="jk-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Jallikattu</span></nav>
          <p className="jk-eyebrow"><span className="jk-dot" /> THE JALLIKATTU EDIT</p>
          <h1 id="jk-title">Jallikattu<br /><span>jerseys.</span></h1>
          <p className="jk-hero-tagline">Wear your roots.<br /><em>Carry your pride.</em></p>
          <p className="jk-hero-description">Jersey T-shirts for Jallikattu, reimagined with bold native bull artwork and a modern point of view. A tribute to Tamil identity, made personal.</p>
          <div className="jk-hero-bottom"><span>DESIGNED WITH PRIDE IN TAMIL NADU</span><span aria-hidden="true">↓</span></div>
        </div>
        <figure className="jk-hero-visual">
          <Image src={`${imageRoot}/jallikattu-black-bull-jersey.webp`} alt={designs[0].alt} width={1200} height={1500} sizes="(max-width: 760px) 100vw, 50vw" priority fetchPriority="high" />
          <div className="jk-image-top"><span>HERITAGE, REIMAGINED.</span><span>SK / 01</span></div>
          <div className="jk-image-seal" aria-label="Tamil roots, modern spirit"><span>TAMIL ROOTS</span><span aria-hidden="true">✳</span><span>MODERN SPIRIT</span></div>
          <figcaption>THE SIGNATURE BULL <span>CHARCOAL / GOLD</span></figcaption>
        </figure>
      </section>

      <div className="jk-wordmark" aria-hidden="true"><span>HERITAGE</span><i>✳</i><span>IDENTITY</span><i>✳</i><span>PRIDE</span><i>✳</i><span>JALLIKATTU</span></div>

      <section className="jk-intro jk-section" aria-labelledby="jk-intro-title">
        <div className="jk-section-label"><span>01 / THE INSPIRATION</span><span lang="ta">வீரம் · மரபு · அடையாளம்</span></div>
        <div className="jk-intro-grid"><h2 id="jk-intro-title">The spirit of the bull.<br /><em>The soul of Tamil Nadu.</em></h2><div><p>Some designs are more than a graphic. They are a connection to home.</p><p>Our Jallikattu jersey concepts put the native bull at the centre: expressive horns, a powerful silhouette and artwork that holds its own. Earthy colours and considered print placement bring that identity into an everyday T-shirt.</p></div></div>
      </section>

      <section id="collection" className="jk-collection jk-section" aria-labelledby="jk-collection-title">
        <div className="jk-section-label"><span>02 / THE DESIGN STUDIES</span><span>ONE IDENTITY. THREE EXPRESSIONS.</span></div>
        <div className="jk-section-heading"><h2 id="jk-collection-title">Tradition.<br /><em>With a fresh perspective.</em></h2><p>Jallikattu bull-print jerseys in a considered palette.<br />Each design starts with the same thing: pride.</p></div>
        <div className="jk-design-grid">{designs.map((design, index) => <article className="jk-design" key={design.image}><figure><Image src={`${imageRoot}/${design.image}.webp`} alt={design.alt} width={900} height={1125} sizes="(max-width: 600px) 90vw, (max-width: 1000px) 44vw, 29vw" /><span className="jk-design-number">0{index + 1}</span></figure><p className="jk-eyebrow">{design.colour}</p><h3>{design.name}</h3><p className="jk-design-description">{design.text}</p></article>)}</div>
        <p className="jk-concept-note">Original design concepts. Final artwork, fabric, colours and availability are confirmed for each order.</p>
      </section>

      <section id="details" className="jk-details jk-section" aria-labelledby="jk-details-title">
        <div className="jk-section-label"><span>03 / MAKE IT YOURS</span><span>YOUR TEAM. YOUR IDENTITY.</span></div>
        <div className="jk-details-grid"><div><p className="jk-eyebrow">CUSTOM JALLIKATTU JERSEY DESIGNS</p><h2 id="jk-details-title">Every detail.<br /><em>A little more you.</em></h2><p className="jk-details-intro">From a single idea to a coordinated team look, the details make a Jallikattu T-shirt feel like it belongs to you.</p><p className="jk-details-footnote">Custom garment and printing enquiries from THE SK APPARELS, Tiruppur. Fabric, fit and finish are selected around the requirements of your order.</p></div><dl><div><dt><span>01</span>Bull artwork</dt><dd>A statement bull graphic, a restrained emblem or your own original Jallikattu illustration. Placement makes the difference.</dd></div><div><dt><span>02</span>Tamil lettering</dt><dd>A village name, a meaningful phrase or your team identity, thoughtfully placed alongside the artwork.</dd></div><div><dt><span>03</span>Team colours & numbers</dt><dd>A palette that brings your group together, with individual names and numbers for a personal finish.</dd></div><div><dt><span>04</span>Your choice of silhouette</dt><dd>Discuss jersey and T-shirt options, preferred sleeves, necklines and a size breakdown that works for your team.</dd></div></dl></div>
      </section>

      <section className="jk-manifesto" aria-label="The Jallikattu collection spirit"><p className="jk-eyebrow">ROOTED HERE. WORN EVERYWHERE.</p><p className="jk-manifesto-title">More than a jersey.<br /><em>A sense of belonging.</em></p><span lang="ta">நம் மண். நம் அடையாளம்.</span></section>

      <section className="jk-faq jk-section" aria-labelledby="jk-faq-title"><div className="jk-section-label"><span>04 / A FEW THINGS TO KNOW</span><span>THE JALLIKATTU EDIT</span></div><div className="jk-faq-grid"><div><h2 id="jk-faq-title">A closer look.</h2><p>Jallikattu T-shirts, bull artwork<br />and the details behind your design.</p></div><div className="jk-faq-list">{faqs.map(faq => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</div></div></section>
      <JallikattuAnimations />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
    </main>
  );
}
