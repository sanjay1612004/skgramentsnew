'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const looks = [
  { id: 'denim', tab: 'Denim Jacket', name: 'Sage Denim Jacket', image: '/images/sage-denim-look.png', caption: 'SAGE GREEN / LAYERED LOOK', headline: 'A little edge. All you.', description: 'Sage denim over a clean white tee. An easy layer for your everyday rotation.', background: '#d7ddcf', alt: 'Model wearing a sage green denim jacket over a white T-shirt' },
  { id: 'bomber', tab: 'Bomber Jacket', name: 'Beige Bomber Jacket', image: '/images/beige-bomber-look.png', caption: 'WARM BEIGE / CASUAL LOOK', headline: 'Keep it effortless.', description: 'A beige bomber, a white tee, and black trousers. A simple combination with its own attitude.', background: '#e5ddcf', alt: 'Model wearing a beige bomber jacket with a white T-shirt and black trousers' },
  { id: 'hoodie', tab: 'Zip Hoodie', name: 'Olive Zip Hoodie', image: '/images/olive-hoodie-look.png', caption: 'OLIVE GREEN / EVERYDAY LOOK', headline: 'Your everyday, layered.', description: 'An olive zip hoodie with clean, understated styling. Zip it up or wear it open and make it yours.', background: '#d8dccb', alt: 'Model wearing an olive green zip hoodie with dark jeans' },
  { id: 'varsity', tab: 'Varsity Jacket', name: 'Navy Varsity Jacket', image: '/images/navy-varsity-look.png', caption: 'NAVY & IVORY / VARSITY LOOK', headline: 'A classic with character.', description: 'Navy and ivory, striped trims, and blue denim. A varsity look that brings the outfit together.', background: '#d2d8e0', alt: 'Model wearing a navy and ivory varsity jacket with blue jeans' },
];

export default function StyleExperience() {
  const [selected, setSelected] = useState(0);
  const reducedMotion = useReducedMotion();
  const look = looks[selected];

  return (
    <section className="fit-section style-section section-pad" id="fit" aria-labelledby="style-heading">
      <div className="section-kicker"><span>03 / THE EVERYDAY EDIT</span><span>FOUR LOOKS. YOUR WAY.</span></div>
      <div className="fit-layout">
        <div>
          <h2 id="style-heading">FIND<br />YOUR <em>STYLE.</em></h2>
          <div className="fit-tabs" role="tablist" aria-label="Choose a look">
            {looks.map((item, index) => (
              <button key={item.id} id={`style-tab-${item.id}`} role="tab" aria-selected={selected === index} aria-controls="style-preview" tabIndex={selected === index ? 0 : -1} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} onKeyDown={event => {
                let next = index;
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % looks.length;
                else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + looks.length) % looks.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = looks.length - 1;
                else return;
                event.preventDefault();
                setSelected(next);
                document.getElementById(`style-tab-${looks[next].id}`)?.focus();
              }}>{item.tab}<span aria-hidden="true">{selected === index ? '●' : '○'}</span></button>
            ))}
          </div>
          <div className="fit-description" aria-live="polite"><h3>{look.headline}</h3><p>{look.description}</p></div>
        </div>

        <motion.div className="fit-visual style-visual" id="style-preview" role="tabpanel" tabIndex={0} aria-labelledby={`style-tab-${look.id}`} animate={{ backgroundColor: look.background }} transition={{ duration: reducedMotion ? 0 : .35 }}>
          <div className="fit-grid" aria-hidden="true" />
          <span className="fit-visual-label">SK / THE EVERYDAY EDIT</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div className="style-photo-wrap" key={look.id} initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }} transition={{ duration: reducedMotion ? 0 : .2 }}>
              <Image className="style-photo" src={look.image} alt={look.alt} fill sizes="(max-width: 760px) 88vw, 48vw" unoptimized />
            </motion.div>
          </AnimatePresence>
          <div className="style-visual-caption"><h3>{look.name}</h3><p>{look.caption}</p></div>
        </motion.div>
      </div>
    </section>
  );
}
