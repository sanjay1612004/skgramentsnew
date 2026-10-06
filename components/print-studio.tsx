'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useModal } from './modal-provider';
import './print-studio.css';

const services = [
  {
    id: 'screen-printing', title: 'Screen Printing', short: 'Bold colour. Strong identity.',
    equipment: 'Multi-station screen printing carousel', material: 'INK & COLOUR',
    description: 'Bring logos, graphics and repeat designs to life with a screen-printed finish.',
  },
  {
    id: 'embroidery', title: 'Embroidery', short: 'Texture in every thread.',
    equipment: 'Four-head embroidery machine', material: 'THREAD & TEXTURE',
    description: 'Give your logo or design depth and character with carefully stitched detail.',
  },
  {
    id: 'dtf-printing', title: 'DTF Printing', short: 'Your artwork. Every detail.',
    equipment: 'DTF printer & curing unit', material: 'PRINT & TRANSFER',
    description: 'Explore direct-to-film printing for colourful artwork and detailed garment graphics.',
  },
] as const;

const ease = [.22, 1, .36, 1] as const;

export default function PrintStudio() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const modal = useModal();
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % services.length;
    else if (event.key === 'ArrowLeft') next = (index + services.length - 1) % services.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = services.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="print-studio section-pad" aria-labelledby="studio-title">
      <motion.div className="studio-kicker" initial={reduced ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease }}>
        <span>05 / PRINT & STITCH STUDIO</span><span><i aria-hidden="true" /> MADE PERSONAL.</span>
      </motion.div>
      <div className="studio-layout">
        <motion.div className="studio-copy" initial={reduced ? false : { opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .8, ease }}>
          <p className="studio-eyebrow">YOUR ARTWORK. OUR CRAFT.</p>
          <h2 id="studio-title" className="studio-heading">Print. Stitch.<br /><span>Stand out.</span></h2>
          <p className="studio-intro">Custom screen printing, embroidery and DTF printing for bulk T-shirt orders. Three ways to make your brand part of the garment.</p>
          <button type="button" className="studio-quote" onClick={() => modal.openQuote({ product: `${services[active].title} for custom garments` })}>Let’s create yours <ArrowUpRight size={19} aria-hidden="true" /></button>
          <p className="studio-note">Have a design in mind? Let’s find its finish.</p>
        </motion.div>
        <motion.div className="studio-tabs" role="tablist" aria-label="Printing and embroidery services" initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7, ease }}>
          {services.map((service, index) => (
            <button type="button" key={service.id} ref={element => { tabs.current[index] = element; }} role="tab" id={`studio-tab-${service.id}`} aria-controls={`studio-panel-${service.id}`} aria-selected={index === active} tabIndex={index === active ? 0 : -1} className={`studio-tab${index === active ? ' is-selected' : ''}`} onClick={() => setActive(index)} onKeyDown={event => onTabKey(event, index)}>
              <span className="studio-tab-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="studio-tab-copy"><strong>{service.title}</strong><small>{service.short}</small></span>
              <span className="studio-tab-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
              <span className="studio-tab-line" aria-hidden="true" />
            </button>
          ))}
        </motion.div>
        <motion.div className="studio-stage" initial={reduced ? false : { opacity: 0, y: 40, scale: .97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .15 }} transition={{ duration: 1, ease }}>
          <div className="studio-stage-grid" aria-hidden="true" />
          {services.map((service, index) => (
            <motion.div key={service.id} id={`studio-panel-${service.id}`} role="tabpanel" aria-labelledby={`studio-tab-${service.id}`} aria-hidden={index !== active} inert={index !== active} tabIndex={index === active ? 0 : -1} className="studio-panel" initial={false}
              animate={{ opacity: index === active ? 1 : 0, x: index === active ? 0 : index < active ? -22 : 22, scale: index === active ? 1 : .97, visibility: index === active ? 'visible' : 'hidden' }} transition={{ duration: reduced ? 0 : .5, ease }}>
              <div className="studio-stage-top"><span>EQUIPMENT / {String(index + 1).padStart(2, '0')}</span><span>{service.material}</span></div>
              <span className="studio-stage-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <motion.div className="studio-machine" whileHover={reduced ? undefined : { y: -5, scale: 1.025 }} transition={{ duration: .45, ease }}>
                <picture><source media="(max-width: 760px)" srcSet={`/images/print-studio/${service.id}-720.webp`} type="image/webp" /><Image src={`/images/print-studio/${service.id}-1200.webp`} alt={service.equipment} fill sizes="(max-width: 760px) 88vw, 52vw" loading="lazy" decoding="async" /></picture>
              </motion.div>
              <div className="studio-stage-caption"><div><h3>{service.title}</h3><span>{service.equipment}</span></div><p>{service.description}</p></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
