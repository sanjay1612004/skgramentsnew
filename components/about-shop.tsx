'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { site } from '@/data/site';
import { useModal } from './modal-provider';
import './about-shop.css';

const ease = [.22, 1, .36, 1] as const;
const photos = [
  { src: '/images/shop/shop1.webp', alt: 'Inside the SK GARMENTS shop, with sewing machines and garment workstations', caption: 'ON THE SHOP FLOOR', width: 383, height: 510 },
  { src: '/images/shop/shop2.webp', alt: 'Another view of the SK GARMENTS workshop, showing worktables, machines and fabric storage', caption: 'WHERE IDEAS TAKE SHAPE', width: 382, height: 510 },
] as const;

function ShopPhoto({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const y = useTransform(progress, value => (value - .5) * (index === 0 ? -32 : 28));
  const photo = photos[index];
  return (
    <motion.div className={`about-shop-photo-position about-shop-photo-position--${index}`} style={{ y: reduced ? 0 : y }}>
      <motion.figure className="about-shop-photo" initial={reduced ? false : { opacity: 0, y: 32, rotate: index === 0 ? -4 : 5 }} whileInView={{ opacity: 1, y: 0, rotate: index === 0 ? -2 : 3 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .9, delay: index * .14, ease }}>
        <div className="about-shop-image"><Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 760px) 48vw, 24vw" loading="lazy" /></div>
        <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption}</figcaption>
      </motion.figure>
    </motion.div>
  );
}

export default function AboutShop({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const modal = useModal();
  const { scrollYProgress } = useScroll({ target: root, offset: ['start end', 'end start'] });
  const reveal = reduced ? undefined : { opacity: 0, y: 24 };

  return (
    <section ref={root} className="about-shop" id="about" aria-labelledby="about-shop-heading">
      <div className="about-shop-kicker"><span>08 / OUR STORY</span><span>SK GARMENTS · TIRUPPUR</span></div>
      <div className="about-shop-layout">
        <div className="about-shop-copy">
          <motion.p className="about-shop-eyebrow" initial={reveal} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, ease }}><span aria-hidden="true" /> MADE HERE. SINCE {site.about.establishedYear}.</motion.p>
          <h2 id="about-shop-heading">
            <span className="about-shop-heading-line"><motion.span initial={reduced ? false : { y: '105%' }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: .85, ease }}>ROOTED HERE.</motion.span></span>
            <span className="about-shop-heading-line about-shop-heading-serif"><motion.span initial={reduced ? false : { y: '105%' }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: .95, delay: .1, ease }}>Made for you.</motion.span></span>
          </h2>
          <motion.div className="about-shop-story" initial={reveal} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .75, delay: .1, ease }}>
            <p>{site.story}</p>
            <p>{site.about.workshopCopy}</p>
          </motion.div>
          <motion.div className="about-shop-actions" initial={reveal} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, delay: .15, ease }}>
            <button type="button" onClick={() => modal.openQuote()} className="about-shop-quote">Let’s make something yours <ArrowUpRight size={18} aria-hidden="true" /></button>
            <a href="#location" className="about-shop-visit">Visit our shop <ArrowUpRight size={16} aria-hidden="true" /></a>
          </motion.div>
        </div>
        <div className="about-shop-gallery">
          <div className="about-shop-gallery-grid" aria-hidden="true" />
          {photos.map((photo, index) => <ShopPhoto key={photo.src} index={index} progress={scrollYProgress} />)}
          <motion.div className="about-shop-seal" initial={reduced ? false : { opacity: 0, scale: .85, rotate: -12 }} whileInView={{ opacity: 1, scale: 1, rotate: -7 }} viewport={{ once: true }} transition={{ duration: .8, delay: .25, ease }} aria-hidden="true"><span>SK</span><small>OUR PLACE.<br />OUR CRAFT.</small><b>✳</b></motion.div>
          <p className="about-shop-gallery-note">A LOOK INSIDE THE PLACE WE CALL HOME.</p>
        </div>
      </div>
      <dl className="about-shop-milestones">
        {[
          { value: String(site.about.establishedYear), label: 'The year we began', note: 'Our story starts here.' },
          { value: `${site.about.ordersHandled}+`, label: 'Orders handled', note: 'Every order, a new idea.' },
          { value: 'Tiruppur', label: 'Our home', note: 'Tamil Nadu, India.' },
        ].map((milestone, index) => <motion.div key={milestone.label} initial={reveal} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .65, delay: index * .1, ease }}><dt>{milestone.label}</dt><dd>{milestone.value}<p>{milestone.note}</p></dd></motion.div>)}
      </dl>
      {children}
    </section>
  );
}
