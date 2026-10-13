'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function StoreDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []);
    const firstInput = dialog.current?.querySelector<HTMLElement>('input:not(:disabled)');
    (firstInput || elements()[0] || dialog.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const list = elements();
      if (!list.length) { event.preventDefault(); return; }
      if (!dialog.current?.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? list[list.length - 1] : list[0]).focus(); return; }
      if (event.shiftKey && (document.activeElement === list[0] || document.activeElement === dialog.current)) { event.preventDefault(); list[list.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === list[list.length - 1]) { event.preventDefault(); list[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus(); };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="ss-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className="ss-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
      <div className="ss-modal-heading"><h2 id={titleId}>{title}</h2><button type="button" className="ss-nav-icon" onClick={onClose} aria-label="Close dialog"><X size={22} aria-hidden="true" /></button></div>
      {children}
    </section>
  </div>, document.body);
}
