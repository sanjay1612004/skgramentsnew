'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function JallikattuAnimations() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.jk-page');
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    // The HTML stays visible until enhancement runs; reverting restores it fully.
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.jk-hero-visual', {
          clipPath: 'inset(5% 6% 5% 6%)', duration: 1.3,
          clearProps: 'clipPath',
        }, 0)
        .from('.jk-breadcrumb, .jk-hero-copy > .jk-eyebrow, #jk-title, .jk-hero-tagline, .jk-hero-description, .jk-hero-bottom', {
          y: 28, opacity: 0, duration: 0.9, stagger: 0.09,
          clearProps: 'transform,opacity',
        }, 0.08)
        .from('.jk-image-top, .jk-hero-visual figcaption', {
          y: 12, opacity: 0, duration: 0.7, stagger: 0.12,
          clearProps: 'transform,opacity',
        }, 0.5)
        .from('.jk-image-seal', {
          rotation: -22, scale: 0.8, opacity: 0, duration: 1,
          clearProps: 'transform,opacity',
        }, 0.6);

      const reveal = (targets: Element[], trigger: Element, stagger = 0.08) => {
        if (!targets.length) return;
        gsap.from(targets, {
          y: 26, opacity: 0, duration: 0.85, stagger, ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger, start: 'top 90%', once: true },
        });
      };

      root.querySelectorAll('.jk-section').forEach(section => {
        reveal(Array.from(section.querySelectorAll(
          '.jk-section-label, .jk-intro-grid > *, .jk-section-heading, .jk-details-grid > div, .jk-faq-grid > div:first-child',
        )), section);
      });

      // Each card/row has its own trigger so mobile visitors see it as they scroll.
      root.querySelectorAll('.jk-design, .jk-details dl > div, .jk-faq-list article').forEach(item => {
        reveal([item], item, 0);
      });

      const manifesto = root.querySelector('.jk-manifesto');
      if (manifesto) reveal(Array.from(manifesto.children), manifesto, 0.12);

      gsap.to('.jk-wordmark i', {
        rotation: 120, ease: 'none',
        scrollTrigger: { trigger: '.jk-wordmark', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }, root);

    // A small, scroll-linked image movement on larger screens only.
    media.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.jk-hero-visual > img', { yPercent: -3, scale: 1.07 }, {
        yPercent: 3, scale: 1.07, ease: 'none',
        scrollTrigger: {
          trigger: '.jk-hero-visual', start: 'top bottom', end: 'bottom top', scrub: 0.8,
        },
      });
    }, root);

    return () => media.revert();
  }, []);

  return null;
}
