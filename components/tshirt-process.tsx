'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, Check } from 'lucide-react';
import './tshirt-process.css';

const steps = [
  { id: 'cutting', title: 'Cutting', description: 'Fabric is measured and cut to the shape of your T-shirt.', alt: 'Illustration of a tailor cutting navy fabric along a T-shirt pattern' },
  { id: 'stitching', title: 'Stitching', description: 'The cut panels come together, one carefully sewn seam at a time.', alt: 'Illustration of a tailor stitching garment panels at an industrial sewing machine' },
  { id: 'ironing', title: 'Ironing', description: 'Steam and a careful press give the finished garment a clean finish.', alt: 'Illustration of a tailor steam-ironing a finished garment' },
  { id: 'packing', title: 'Packing', description: 'Your T-shirt is packed with care, ready for its journey.', alt: 'Illustration of a worker sealing a parcel with packing tape' },
  { id: 'dispatch', title: 'Dispatch', description: 'Packed orders are loaded for delivery. From our hands to yours.', alt: 'Illustration of a parcel being handed over at a delivery truck' },
] as const;

type Step = typeof steps[number];

function ProcessImage({ step, eager = false }: { step: Step; eager?: boolean }) {
  return <picture><source media="(max-width: 760px)" srcSet={`/images/tshirt-process/${step.id}-640.webp`} type="image/webp" /><Image src={`/images/tshirt-process/${step.id}-1200.webp`} alt={step.alt} fill sizes="(max-width: 760px) 88vw, 62vw" loading={eager ? 'eager' : 'lazy'} decoding="async" /></picture>;
}

function ProcessScene({ step, index, progress }: { step: Step; index: number; progress: MotionValue<number> }) {
  const start = index / steps.length;
  const end = (index + 1) / steps.length;
  // Explicit clamping keeps faded scenes hidden outside their scroll interval.
  const opacity = useTransform(progress, value => {
    const enter = index === 0 ? 1 : (value - start + .025) / .05;
    const leave = index === steps.length - 1 ? 1 : (end + .025 - value) / .05;
    return Math.max(0, Math.min(1, enter, leave));
  });
  const scale = useTransform(progress, value => .985 + Math.max(0, Math.min(1, (value - start) / (end - start))) * .03);
  const y = useTransform(progress, value => 8 - Math.max(0, Math.min(1, (value - start) / (end - start))) * 16);
  return <motion.div className="tee-process-scene" style={{ opacity, scale, y }} aria-hidden="true"><ProcessImage step={step} /></motion.div>;
}

export default function TShirtProcess() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const lastStage = useRef(0);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (reduced) return;
    const next = Math.min(steps.length - 1, Math.max(0, Math.floor(value * steps.length)));
    if (next !== lastStage.current) {
      lastStage.current = next;
      setActive(next);
    }
  });
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const preload = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      section.querySelectorAll<HTMLImageElement>('img').forEach(image => {
        image.loading = 'eager';
        void image.decode().catch(() => {});
      });
      preload.disconnect();
    }, { rootMargin: '100% 0px' });
    preload.observe(section);
    return () => preload.disconnect();
  }, [reduced]);
  const current = steps[active];

  return (
    <section ref={root} className="tee-process" id="making" aria-labelledby="tee-process-heading">
      <div className="tee-process-screen">
        <div className="section-kicker"><span>07 / THE MAKING OF A T-SHIRT</span><span>FROM FABRIC TO YOUR DOOR.</span></div>
        <h2 id="tee-process-heading">MADE WITH<br /><em>CARE.</em></h2>
        {reduced ? (
          <ol className="tee-process-static">
            {steps.map((step, index) => <li key={step.id}><div className="tee-process-static-image"><ProcessImage step={step} /></div><h3>{String(index + 1).padStart(2, '0')} / {step.title}</h3><p>{step.description}</p></li>)}
          </ol>
        ) : (
          <>
            <div className="tee-process-display">
              <span className="tee-process-watermark" aria-hidden="true">{current.title.toUpperCase()}</span>
              <div className="tee-process-visual">
                {steps.map((step, index) => <ProcessScene key={step.id} step={step} index={index} progress={scrollYProgress} />)}
              </div>
              <div className="tee-process-caption" aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span><h3>{current.title}</h3><p>{current.description}</p></div>
            </div>
            <div className="tee-process-progress" role="progressbar" aria-label="T-shirt making journey" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={active + 1} aria-valuetext={`Step ${active + 1} of ${steps.length}: ${current.title}`} />
            <ol className="tee-process-dots" aria-label="Making stages">
              {steps.map((step, index) => <li key={step.id} className={index === active ? 'is-current' : index < active ? 'is-complete' : ''} aria-current={index === active ? 'step' : undefined}>
                <span className="tee-process-dot" aria-hidden="true">{index < active ? <Check size={12} strokeWidth={2.5} /> : <i />}</span>
                <div><span>{step.title}</span><small>{index === active ? 'IN PROGRESS' : index < active ? 'COMPLETE' : 'UP NEXT'}</small></div>
              </li>)}
            </ol>
            <div className="tee-process-bottom"><span>ONE TEE. EVERY STEP CONSIDERED.</span><span>SCROLL TO FOLLOW THE JOURNEY <ArrowDown size={13} aria-hidden="true" /></span></div>
          </>
        )}
      </div>
    </section>
  );
}
