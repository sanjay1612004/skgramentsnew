'use client';

import { useModal } from './modal-provider';

export default function BulkQuoteButton({ className = 'button dark' }: { className?: string }) {
  const { openQuote } = useModal();
  return <button type="button" className={className} onClick={() => openQuote({ product: 'Bulk T-shirt / wholesale garment order' })}>Get a bulk order quote</button>;
}
