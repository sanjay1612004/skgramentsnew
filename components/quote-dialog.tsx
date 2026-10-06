'use client';

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, LoaderCircle, Mail, X } from 'lucide-react';
import { gsap } from 'gsap';
import { site } from '@/data/site';

export type QuoteDetails = { product?: string; color?: string; size?: string };

function phoneValidationMessage(value: string) {
  if (!value.trim()) return '';
  const digits = value.replace(/\D/g, '');
  return /^\+?[\d\s().-]+$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15
    ? '' : 'Enter a phone number with 7–15 digits. You can include a country code, spaces, or dashes.';
}

export default function QuoteDialog({ details, close }: { details: QuoteDetails; close: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const subject = details.product ? `Quote for ${details.product}` : 'Garment quote request';
  const message = details.product
    ? `I’d like a quote for ${details.product}${details.color ? ` in ${details.color}` : ''}${details.size ? `, size ${details.size}` : ''}. Please share availability, final price, and delivery options.`
    : '';

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    dialog.showModal();

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      animationRef.current = gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.quote-backdrop', { opacity: 0, duration: 0.45 })
        .fromTo('.quote-card',
          { opacity: 0, y: 54, scale: 0.9, rotationX: 7, transformPerspective: 1200, clipPath: 'inset(8% 16% 8% 16% round 28px)' },
          { opacity: 1, y: 0, scale: 1, rotationX: 0, clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 0.8, ease: 'power4.out' }, 0.05)
        .from('.quote-brand', { clipPath: 'inset(0 100% 0 0)', duration: 0.75, ease: 'power4.inOut' }, 0.15)
        .from('.quote-brand-orbit', { scale: 0.45, rotation: -70, opacity: 0, stagger: 0.1, duration: 1.1 }, 0.15)
        .from('.quote-brand-star', { rotation: -120, scale: 0.25, opacity: 0, duration: 1.05, ease: 'back.out(1.4)' }, 0.25)
        .from('.quote-brand-line > span', { yPercent: 110, rotation: 3, stagger: 0.07, duration: 0.65, ease: 'power4.out' }, 0.35)
        .from('.quote-brand-label,.quote-brand-bottom', { opacity: 0, y: 8, stagger: 0.15, duration: 0.5 }, 0.35)
        .from('[data-quote-reveal]', { opacity: 0, y: 20, stagger: 0.075, duration: 0.5 }, 0.3)
        .from('.quote-title-line > span', { yPercent: 110, duration: 0.65, ease: 'power4.out' }, 0.3);
    }, dialog);

    return () => {
      media.revert();
      animationRef.current?.kill();
      gsap.killTweensOf(dialog.querySelectorAll('.quote-card,.quote-backdrop'));
      dialog.close();
      document.body.style.paddingRight = previousPadding;
      const focusTarget = trigger?.isConnected ? trigger : document.querySelector<HTMLElement>('.mobile-menu-button');
      focusTarget?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  useLayoutEffect(() => {
    if (status !== 'success') return;
    const dialog = dialogRef.current;
    const success = dialog?.querySelector<HTMLElement>('.quote-success');
    success?.focus({ preventScroll: true });
    if (!dialog || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.timeline()
        .from('.quote-success-icon', { scale: 0.4, rotation: -20, opacity: 0, duration: 0.55, ease: 'back.out(1.6)' })
        .from('.quote-success > h3,.quote-success > p,.quote-success > button', { y: 15, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.15);
    }, dialog);
    return () => context.revert();
  }, [status]);

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      close();
      return;
    }
    animationRef.current?.kill();
    const dialog = dialogRef.current;
    gsap.timeline({ onComplete: close })
      .to(dialog?.querySelector('.quote-card') ?? [], { opacity: 0, y: 24, scale: 0.96, clipPath: 'inset(4% 8% 4% 8% round 24px)', duration: 0.28, ease: 'power2.in' })
      .to(dialog?.querySelector('.quote-backdrop') ?? [], { opacity: 0, duration: 0.3 }, 0);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestRef.current) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const subject = String(form.get('subject') || '').trim();
    const message = String(form.get('message') || '').trim();
    const phoneError = phoneValidationMessage(phone);
    if (phoneError) {
      setPhoneError(phoneError);
      const input = event.currentTarget.elements.namedItem('phone') as HTMLInputElement;
      input.setCustomValidity(phoneError);
      input.reportValidity();
      return;
    }
    if (!email || !subject || !message) {
      setErrorMessage('Please enter your email, a subject, and a message.');
      setStatus('error');
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setStatus('sending');
    setErrorMessage('');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${site.contact.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          email,
          ...(phone ? { 'Phone number': phone } : {}),
          'Request subject': subject,
          ...(details.product ? { Product: details.product } : {}),
          ...(details.color ? { Color: details.color } : {}),
          ...(details.size ? { Size: details.size } : {}),
          'Request details': message,
          _replyto: email,
          _subject: `New quote request | SK GARMENTS — ${subject}`,
          _template: 'table',
          _captcha: 'false',
          _honey: String(form.get('_honey') || ''),
        }),
      });
      const result = await response.json();
      if (requestRef.current !== controller) return;
      if (/activat|confirm.{0,30}email|verif/i.test(String(result.message || ''))) {
        throw new Error('Quote delivery is awaiting confirmation from SK GARMENTS. Please try again shortly or call us.');
      }
      if (!response.ok || !(result.success === true || result.success === 'true')) {
        throw new Error('Your quote could not be sent. Please try again or call SK GARMENTS.');
      }
      setReplyEmail(email);
      setStatus('success');
    } catch (error) {
      if (requestRef.current !== controller) return;
      setErrorMessage(error instanceof Error && error.name !== 'AbortError' && error.name !== 'TypeError'
        ? error.message
        : 'We couldn’t connect to send your quote. Please check your connection and try again.');
      setStatus('error');
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  return (
    <dialog ref={dialogRef} className="quote-modal" aria-labelledby="quote-title" aria-describedby="quote-description" onCancel={event => { event.preventDefault(); dismiss(); }}>
      <div className="quote-backdrop" aria-hidden="true" />
      <div className="quote-card">
        <aside className="quote-brand" aria-hidden="true">
          <span className="quote-brand-orbit orbit-one" /><span className="quote-brand-orbit orbit-two" />
          <div className="quote-brand-label">SK GARMENTS <span>TIRUPPUR</span></div>
          <span className="quote-brand-star">✳</span>
          <div className="quote-brand-copy"><span>MADE FOR YOUR NEXT IDEA.</span><p><span className="quote-brand-line"><span>Let’s make</span></span><span className="quote-brand-line"><span>something</span></span><span className="quote-brand-line"><span><em>worth wearing.</em></span></span></p></div>
          <div className="quote-brand-bottom"><span>GOOD FITS. GREAT POSSIBILITIES.</span><span>SK / 01</span></div>
        </aside>
        <div className="quote-content">
          <header className="quote-header" data-quote-reveal>
            <div><span className="quote-eyebrow">START A CONVERSATION</span><h2 id="quote-title" className="quote-title-line"><span>Get a quote<span className="quote-title-dot">.</span></span></h2></div>
            <button type="button" className="quote-close" aria-label="Close quote dialog" onClick={dismiss} autoFocus><X size={20} /></button>
          </header>
          <p id="quote-description" data-quote-reveal>{status === 'success' ? 'A good idea is already on its way.' : <>One piece or a whole collection.<br />Tell us what you have in mind.</>}</p>
          {status === 'success' ? <section className="quote-success" tabIndex={-1} aria-label="Quote request received">
            <span className="quote-success-icon"><Check size={30} strokeWidth={1.7} /></span>
            <h3>Thank you.<br />Let’s make it happen.</h3>
            <p role="status">Your quote request has been submitted. We’ll reply to <strong>{replyEmail}</strong>.</p>
            <button type="button" className="quote-submit" onClick={dismiss}>Done <ArrowUpRight size={19} /></button>
          </section> : <form className="quote-form" onSubmit={submit} aria-busy={status === 'sending'}>
            <input type="text" name="_honey" className="quote-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <fieldset disabled={status === 'sending'}>
            <div className="quote-contact-fields">
            <label data-quote-reveal>Your email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
            <label data-quote-reveal>Phone number (optional)<input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="+91 98765 43210" aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? 'quote-phone-error' : undefined} onChange={event => {
              const error = phoneValidationMessage(event.currentTarget.value);
              event.currentTarget.setCustomValidity(error);
              if (phoneError) setPhoneError(error);
            }} onBlur={event => {
              const error = phoneValidationMessage(event.currentTarget.value);
              event.currentTarget.setCustomValidity(error);
              setPhoneError(error);
            }} onInvalid={event => setPhoneError(phoneValidationMessage(event.currentTarget.value))} />
            {phoneError && <span className="quote-input-error" id="quote-phone-error" role="alert">{phoneError}</span>}
            </label>
            </div>
            <label data-quote-reveal>Subject<input name="subject" required maxLength={160} defaultValue={subject} /></label>
            <div className="quote-field" data-quote-reveal><label htmlFor="quote-message">Message</label><textarea id="quote-message" name="message" required maxLength={2000} rows={3} defaultValue={message} placeholder="Garments, quantities, sizes, and delivery location…" /></div>
            </fieldset>
            {status === 'error' && <p className="quote-error" role="alert">{errorMessage} <a href={`tel:${site.contact.phone.replace(/[^+\d]/g, '')}`}>Call {site.contact.phone}</a></p>}
            <span className="sr-only" role="status">{status === 'sending' ? 'Sending your quote request.' : ''}</span>
            <div className="quote-actions" data-quote-reveal>
              <button type="button" className="quote-cancel" onClick={dismiss}>Cancel</button>
              <button type="submit" className="quote-submit" disabled={status === 'sending'}>{status === 'sending' ? <>Sending quote <LoaderCircle size={18} className="quote-spinner" /></> : <>Submit quote <ArrowUpRight size={19} /></>}</button>
            </div>
            <p className="quote-delivery-note" data-quote-reveal><Mail size={13} /> Sent directly to SK GARMENTS. We’ll reply by email.</p>
          </form>}
        </div>
      </div>
    </dialog>
  );
}
