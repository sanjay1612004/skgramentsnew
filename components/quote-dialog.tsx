'use client';

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CircleAlert, LoaderCircle, Mail, X } from 'lucide-react';
import { gsap } from 'gsap';
import { site } from '@/data/site';
import { sendBrandedQuote, sendQuoteCopies } from '@/lib/quote-delivery';
import QuoteCountryPicker from '@/components/quote-country-picker';
import { internationalPhone, validateQuoteFields } from '@/lib/quote-validation.mjs';

export type QuoteDetails = { product?: string; color?: string; size?: string };

type QuoteField = 'email' | 'country' | 'phone' | 'subject' | 'message';
type QuoteErrors = Partial<Record<QuoteField, string>>;

function readFields(form: HTMLFormElement) {
  const data = new FormData(form);
  return { email: String(data.get('email') || '').trim(), country: String(data.get('country') || ''), phone: String(data.get('phone') || '').trim(), subject: String(data.get('subject') || '').trim(), message: String(data.get('message') || '').trim() };
}

export default function QuoteDialog({ details, close }: { details: QuoteDetails; close: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const deliveryRef = useRef<{ key: string; accepted: Set<string> }>({ key: '', accepted: new Set() });
  const brandedDeliveryRef = useRef({ key: '', requestId: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [fieldErrors, setFieldErrors] = useState<QuoteErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateField = (form: HTMLFormElement, name: QuoteField, onBlur = false) => {
    if (!onBlur && !fieldErrors[name] && !hasSubmitted) return;
    const errors = validateQuoteFields(readFields(form));
    setFieldErrors(previous => {
      const next = { ...previous };
      if (errors[name]) next[name] = errors[name];
      else delete next[name];
      if (name === 'country') {
        if (errors.phone && (previous.phone || hasSubmitted)) next.phone = errors.phone;
        else delete next.phone;
      }
      return next;
    });
  };

  const errorProps = (name: QuoteField) => ({
    'aria-invalid': fieldErrors[name] ? true as const : undefined,
    'aria-describedby': fieldErrors[name] ? `quote-${name}-error` : undefined,
  });
  const fieldError = (name: QuoteField) => fieldErrors[name]
    ? <span className="quote-input-error" id={`quote-${name}-error`} role="alert"><CircleAlert size={12} aria-hidden="true" />{fieldErrors[name]}</span> : null;
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
    const values = readFields(event.currentTarget);
    const errors = validateQuoteFields(values);
    setFieldErrors(errors);
    setHasSubmitted(true);
    if (Object.keys(errors).length) {
      setStatus('idle');
      const firstField = Object.keys(errors)[0];
      const input = event.currentTarget.elements.namedItem(firstField) as HTMLElement | null;
      input?.focus();
      return;
    }
    const { email, subject, message } = values;
    const phone = internationalPhone(values.phone, values.country);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setStatus('sending');
    setErrorMessage('');
    try {
      const payload: Record<string, string> = {
          email,
          'Phone number': phone,
          'Request subject': subject,
          ...(details.product ? { Product: details.product } : {}),
          ...(details.color ? { Color: details.color } : {}),
          ...(details.size ? { Size: details.size } : {}),
          'Request details': message,
          _replyto: email,
          _subject: `New quote request | THE SK APPARELS — ${subject}`,
          _template: 'table',
          _captcha: 'false',
          _honey: String(form.get('_honey') || ''),
      };
      const key = JSON.stringify(payload);
      const brandedEndpoint = process.env.NEXT_PUBLIC_QUOTE_API_URL?.trim();
      if (brandedEndpoint) {
        if (brandedDeliveryRef.current.key !== key) brandedDeliveryRef.current = { key, requestId: crypto.randomUUID() };
        await sendBrandedQuote(brandedEndpoint, { requestId: brandedDeliveryRef.current.requestId, email, phone, country: values.country, subject, message, ...details, honey: String(form.get('_honey') || '') }, controller.signal);
        if (requestRef.current !== controller) return;
        setReplyEmail(email);
        setStatus('success');
        return;
      }
      if (deliveryRef.current.key !== key) deliveryRef.current = { key, accepted: new Set() };
      const recipients = [...new Set([site.contact.email, ...site.contact.quoteAdditionalRecipients])];
      const pending = recipients.filter(recipient => !deliveryRef.current.accepted.has(recipient));
      const result = await sendQuoteCopies(pending, payload, controller.signal);
      if (requestRef.current !== controller) return;
      result.accepted.forEach(recipient => deliveryRef.current.accepted.add(recipient));
      if (result.failures.length) {
        const partial = deliveryRef.current.accepted.size > 0;
        const activation = result.failures.some(failure => failure.reason === 'activation');
        throw new Error(activation
          ? partial
            ? 'Your request reached THE SK APPARELS. An additional copy is awaiting confirmation from the shop. Please call us or try again later.'
            : 'Quote delivery is awaiting confirmation from THE SK APPARELS. Please try again shortly or call us.'
          : partial
            ? 'Your request reached THE SK APPARELS, but an additional copy could not be submitted. Please retry to complete it or call us.'
            : 'Your quote could not be sent. Please check your connection and try again or call THE SK APPARELS.');
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
          <div className="quote-brand-label">THE SK APPARELS <span>TIRUPPUR</span></div>
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
          </section> : <form className="quote-form" noValidate onSubmit={submit} onChange={event => {
            const input = event.target;
            if ((input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) && ['email', 'country', 'phone', 'subject', 'message'].includes(input.name)) validateField(event.currentTarget, input.name as QuoteField);
          }} onBlur={event => {
            const input = event.target;
            if ((input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) && ['email', 'country', 'phone', 'subject', 'message'].includes(input.name)) validateField(event.currentTarget, input.name as QuoteField, true);
          }} aria-busy={status === 'sending'}>
            <input type="text" name="_honey" className="quote-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <fieldset disabled={status === 'sending'}>
              <p className="quote-required-note">All fields are required.</p>
              <div className="quote-contact-fields">
                <div className="quote-field" data-quote-reveal>
                  <label htmlFor="quote-email">Your email</label>
                  <input id="quote-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" {...errorProps('email')} />
                  {fieldError('email')}
                </div>
                <div className="quote-field" data-quote-reveal>
                  <label htmlFor="quote-phone">Phone number</label>
                  <div className={`quote-phone-control${fieldErrors.phone || fieldErrors.country ? ' has-error' : ''}`}>
                    <QuoteCountryPicker value={countryCode} dialogRef={dialogRef} disabled={status === 'sending'} onChange={nextCountry => {
                      setCountryCode(nextCountry);
                      const form = dialogRef.current?.querySelector('form');
                      if (!form) return;
                      const errors = validateQuoteFields({ ...readFields(form), country: nextCountry });
                      setFieldErrors(previous => {
                        const next = { ...previous };
                        delete next.country;
                        if (errors.phone && (previous.phone || hasSubmitted)) next.phone = errors.phone;
                        else delete next.phone;
                        return next;
                      });
                    }} />
                    <input id="quote-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={30} placeholder={countryCode === 'IN' ? '98765 43210' : 'Phone number'} {...errorProps('phone')} />
                  </div>
                  {fieldError('country')}{fieldError('phone')}
                </div>
              </div>
              <div className="quote-field" data-quote-reveal>
                <label htmlFor="quote-subject">Subject</label>
                <input id="quote-subject" name="subject" required minLength={3} maxLength={160} defaultValue={subject} {...errorProps('subject')} />
                {fieldError('subject')}
              </div>
              <div className="quote-field" data-quote-reveal>
                <label htmlFor="quote-message">Message</label>
                <textarea id="quote-message" name="message" required minLength={10} maxLength={2000} rows={3} defaultValue={message} placeholder="Garments, quantities, sizes, and delivery location…" {...errorProps('message')} />
                {fieldError('message')}
              </div>
            </fieldset>
            {status === 'error' && <p className="quote-error" role="alert"><CircleAlert size={15} aria-hidden="true" /><span>{errorMessage} <a href={`tel:${site.contact.phone.replace(/[^+\d]/g, '')}`}>Call {site.contact.phone}</a></span></p>}
            <span className="sr-only" role="status">{status === 'sending' ? 'Sending your quote request.' : ''}</span>
            <div className="quote-actions" data-quote-reveal>
              <button type="button" className="quote-cancel" onClick={dismiss}>Cancel</button>
              <button type="submit" className="quote-submit" disabled={status === 'sending'}>{status === 'sending' ? <>Sending quote <LoaderCircle size={18} className="quote-spinner" /></> : <>Submit quote <ArrowUpRight size={19} /></>}</button>
            </div>
            <p className="quote-delivery-note" data-quote-reveal><Mail size={13} /> Sent directly to THE SK APPARELS. We’ll reply by email.</p>
          </form>}
        </div>
      </div>
    </dialog>
  );
}
