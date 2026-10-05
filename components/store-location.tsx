import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import { site } from '@/data/site';

export default function StoreLocation() {
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

      <div className="store-location-mark" aria-hidden="true">
        <div className="store-art-top"><span>THE PLACE WE CALL HOME</span><ArrowUpRight size={21} strokeWidth={1} /></div>
        <div className="store-brand-art">
          <svg className="store-contours" viewBox="0 0 500 500" fill="none">
            {[210, 175, 140, 105].map(radius => <ellipse key={radius} cx="250" cy="250" rx={radius} ry={radius * 1.28} transform="rotate(35 250 250)" />)}
            <path d="M0 250H500M250 0V500" strokeDasharray="2 9" />
          </svg>
          <span className="store-art-star">✳</span>
          <strong>SK</strong>
          <span className="store-art-signature">EVERYDAY FITS. MADE DIFFERENTLY.</span>
        </div>
        <div className="store-art-bottom"><div><span>ROOTED IN</span><strong>TIRUPPUR.</strong></div><span className="store-origin">TAMIL NADU<br />INDIA</span></div>
      </div>
    </section>
  );
}
