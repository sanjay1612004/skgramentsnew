'use client';
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

export default function ProfilePopover({ anchor, onClose, children }: { anchor: RefObject<HTMLDivElement | null>; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = panel.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.querySelector<HTMLElement>('button,input')?.focus();
    const outside = (event: Event) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target)) onClose();
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', onKey);
      if ((document.activeElement === document.body || node?.contains(document.activeElement)) && previous?.isConnected) previous.focus();
    };
  }, [anchor, onClose]);
  return <section ref={panel} className="ss-profile-popover" role="dialog" aria-label="Your profile">
    {children}
  </section>;
}
