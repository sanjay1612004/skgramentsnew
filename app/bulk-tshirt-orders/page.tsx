import Image from 'next/image';
import BulkQuoteButton from '@/components/bulk-quote-button';
import { bulkServices, bulkFaqs } from '@/data/bulk-orders';
import { site } from '@/data/site';
import { getWhatsAppUrl } from '@/lib/contact';
import { businessId, jsonLd, pageMetadata, websiteId } from '@/lib/seo';
import '@/components/bulk-orders.css';

const path = '/bulk-tshirt-orders/';
const description = 'Request bulk T-shirt and wholesale garment quotes from THE SK APPARELS, Tiruppur. Explore custom screen printing, embroidery and DTF printing for your order.';
export const metadata = pageMetadata('Bulk T-Shirt Orders & Wholesale Garments in Tiruppur', description, path);

export default function BulkOrdersPage() {
  const url = `${site.origin}${path}`;
  const structuredData = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: 'Bulk T-Shirt Orders & Wholesale Garments in Tiruppur', description, isPartOf: { '@id': websiteId }, about: { '@id': businessId } },
      { '@type': 'Service', '@id': `${url}#service`, name: 'Bulk T-shirt and wholesale garment enquiries', serviceType: 'Bulk T-shirt orders and wholesale garments', description, url, provider: { '@id': businessId }, hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Custom garment finishes', itemListElement: bulkServices.map(service => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service.title, description: service.text, provider: { '@id': businessId } } })) } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${site.origin}/` }, { '@type': 'ListItem', position: 2, name: 'Bulk T-shirt orders', item: url }] },
    ],
  };

  return <main className="bulk-page" id="main">
    <section className="bulk-page-hero section-pad">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Bulk T-shirt orders</span></nav>
      <div className="bulk-page-hero-grid"><div><p className="eyebrow">THE SK APPARELS / TIRUPPUR / SINCE 2016</p><h1>Bulk T-shirt orders.<br /><span>Made for your brand.</span></h1><p>Wholesale garments and custom T-shirt enquiries from our shop in Tiruppur, Tamil Nadu. For your next collection, your team or your event, start with the pieces you need and the design you have in mind.</p><BulkQuoteButton /><a className="text-link" href={getWhatsAppUrl('Hi THE SK APPARELS, I would like a quote for a bulk T-shirt / wholesale garment order.')} target="_blank" rel="noopener noreferrer">Discuss your order on WhatsApp</a></div><figure><Image src="/images/shop/shop1.webp" alt="Sewing machines and work tables inside the THE SK APPARELS workshop in Tiruppur" width={383} height={510} sizes="(max-width: 760px) 88vw, 38vw" priority /><figcaption>Our workshop. Tiruppur, Tamil Nadu.</figcaption></figure></div>
      <div className="bulk-facts"><p><strong>2016</strong><span>Established in Tiruppur</span></p><p><strong>200+</strong><span>Orders handled</span></p><p><strong>Your design</strong><span>Printing & embroidery enquiries</span></p></div>
    </section>
    <section className="bulk-page-services section-pad" aria-labelledby="bulk-services-title"><p className="eyebrow">WHOLESALE & CUSTOM ORDERS</p><h2 id="bulk-services-title">One order.<br /><span>Your own finish.</span></h2><p className="bulk-section-description">Wholesalers and resellers can enquire about T-shirt styles and quantities for resale. Teams, businesses and event organisers can discuss garments with their own logos or artwork. Explore our <a href="/#shop">T-shirt and garment styles</a>, then tell us what you need.</p><div className="bulk-service-list">{bulkServices.map((service, index) => <article key={service.id}><span className="bulk-number">0{index + 1}</span><h3>{service.title}</h3><p>{service.text}</p><a className="text-link" href={service.href}>Explore {service.id === 'embroidery' ? 'embroidery' : service.id === 'dtf-printing' ? 'DTF printing' : 'screen printing'}</a></article>)}</div></section>
    <section className="bulk-order-guide section-pad" aria-labelledby="order-guide-title"><div><p className="eyebrow">A CLEAR START</p><h2 id="order-guide-title">What to send<br /><span>with your enquiry.</span></h2><p>A few details help us understand your order and prepare a useful quote.</p></div><ol><li><h3>Garments & quantity</h3><p>Tell us the style, total number of pieces, size breakdown and your preferred fabric or colours.</p></li><li><h3>Artwork & customisation</h3><p>Describe your logo or design, print positions and whether you are considering printing or embroidery.</p></li><li><h3>Location & required date</h3><p>Include your delivery location and when you need the order. We will confirm availability, pricing and dispatch arrangements.</p></li></ol></section>
    <section className="bulk-page-faq section-pad" aria-labelledby="bulk-faq-title"><p className="eyebrow">BEFORE YOU ORDER</p><h2 id="bulk-faq-title">Bulk order questions.</h2><div>{bulkFaqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
    <section className="bulk-page-contact section-pad"><p className="eyebrow">LET’S TALK ABOUT YOUR ORDER</p><h2>Start with<br /><span>a conversation.</span></h2><p>{site.contact.address}, {site.contact.city}. <a href="/#about">Meet THE SK APPARELS</a> or <a href="/#location">find our shop</a>.</p><div><BulkQuoteButton /><a className="text-link" href={`tel:+91${site.contact.phone}`}>Call +91 {site.contact.phone}</a></div><p className="small-copy">A quote request starts an enquiry. Specifications, minimum quantities, prices, delivery and payment terms are confirmed before an order is placed.</p></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
  </main>;
}
