'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { X } from 'lucide-react';
import QuoteDialog, { QuoteDetails } from './quote-dialog';

type ModalContextValue = {
  openQuote: (details?: QuoteDetails) => void;
  openInfo: (title: string, text: string) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);
export const useModal = () => useContext(ModalContext)!;

function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.getElementById('active-dialog');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]') || []);
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements[elements.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) {
        event.preventDefault();
        elements[0].focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [close]);

  return (
    <motion.div className="dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        id="active-dialog"
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
      >
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Close dialog"><X /></button>
        </div>
        {children}
      </motion.section>
    </motion.div>
  );
}

export default function ModalProvider({ children }: { children: ReactNode }) {
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [info, setInfo] = useState<{ title: string; text: string } | null>(null);
  return (
    <MotionConfig reducedMotion="user">
      <ModalContext.Provider value={{ openQuote: (details = {}) => setQuote(details), openInfo: (title, text) => setInfo({ title, text }) }}>
        {children}
        {quote && <QuoteDialog details={quote} close={() => setQuote(null)} />}
        <AnimatePresence>
          {info && <Dialog title={info.title} close={() => setInfo(null)}><p className="info-copy">{info.text}</p></Dialog>}
        </AnimatePresence>
      </ModalContext.Provider>
    </MotionConfig>
  );
}
