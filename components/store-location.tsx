import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import { site } from '@/data/site';

export default function StoreLocation() {
  const mapQuery = `${site.contact.address}, ${site.contact.city}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;
  const phoneUrl = `tel:${site.contact.phone.replace(/[^+\d]/g, '')}`;

  return (
    <section className="store" id="location" aria-labelledby="store-heading">
      <div className="store-details">
        <p className="store-eyebrow"><span /> SK GARMENTS / TIRUPPUR</p>
        <h3 id="store-heading">COME<br /><em>SAY HI.</em></h3>
        <p className="store-intro">A little style. A proper conversation.<br />Find your next favorite, right here.</p>

        <div className="store-contact-details">
          <div className="store-contact-row">
            <MapPin size={19} strokeWidth={1.5} aria-hidden="true" />
            <div><span className="store-detail-label">FIND US</span><address>{site.contact.address}<br />{site.contact.city}</address></div>
          </div>
          <div className="store-contact-row">
            <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
            <div><span className="store-detail-label">LET’S TALK</span><a className="store-phone" href={phoneUrl}>{site.contact.phone}</a></div>
          </div>
        </div>

        <div className="store-actions">
          {site.contact.mapsUrl && <a className="store-directions" href={site.contact.mapsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={19} aria-hidden="true" /></a>}
          <a className="store-call" href={phoneUrl}>Call the store <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        <p className="store-hours"><Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />{site.contact.hours}</p>
      </div>

      <div className="store-map-panel">
        <div className="store-map-heading">
          <span className="store-map-eyebrow"><span aria-hidden="true" /> THE PLACE WE CALL HOME</span>
          <h4>Find us in <em>Tiruppur.</em></h4>
          <p>A little closer to your next favourite.</p>
        </div>
        <div className="store-map-frame">
          <iframe src={mapEmbedUrl} title="Google Map showing the SK GARMENTS shop address in Tiruppur" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div className="store-map-footer">
          <div className="store-map-pin"><MapPin size={20} strokeWidth={1.5} aria-hidden="true" /></div>
          <div><strong>SK GARMENTS</strong><span>Amarajyothi Nagar · Samundipuram</span></div>
          {site.contact.mapsUrl && <a href={site.contact.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the SK GARMENTS shop address in Google Maps"><span>Open in Google Maps</span><ArrowUpRight size={20} aria-hidden="true" /></a>}
        </div>
      </div>
    </section>
  );
}
