import { bulkServices } from '@/data/bulk-orders';
import BulkQuoteButton from './bulk-quote-button';
import './bulk-orders.css';

export default function BulkOrdersSummary() {
  return <section className="bulk-summary section-pad" id="bulk-orders" aria-labelledby="bulk-summary-title">
    <div className="section-kicker"><span>BULK & WHOLESALE</span><span>TIRUPPUR, TAMIL NADU</span></div>
    <div className="bulk-summary-intro"><h2 id="bulk-summary-title">Your brand.<br /><span>Your whole crew.</span></h2><div><p>Looking for a T-shirt wholesaler in Tiruppur? Talk to SK GARMENTS about bulk T-shirt orders for resale, teams, events and branded clothing.</p><p>Choose a garment direction, share your quantity and tell us how you want to make it yours. We’ll confirm the specifications, customisation and price for your enquiry.</p><a className="text-link" href="/bulk-tshirt-orders/">Bulk T-shirt orders & wholesale enquiries</a></div></div>
    <div className="bulk-service-list">{bulkServices.map((service, index) => <article key={service.id}><span className="bulk-number">0{index + 1}</span><h3>{service.title}</h3><p>{service.text}</p></article>)}</div>
    <div className="bulk-summary-actions"><BulkQuoteButton /><p>Bring your quantity, size breakdown, design and delivery location.</p></div>
  </section>;
}
