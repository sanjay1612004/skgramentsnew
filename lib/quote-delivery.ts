export type QuoteDeliveryFailure = { recipient: string; reason: 'activation' | 'network' | 'rejected' };

export type BrandedQuoteRequest = { requestId: string; email: string; phone: string; subject: string; message: string; product?: string; color?: string; size?: string; honey: string };

export async function sendBrandedQuote(endpoint: string, payload: BrandedQuoteRequest, signal: AbortSignal) {
  const url = new URL(endpoint, window.location.origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Quote email setup needs a secure connection. Please call SK GARMENTS.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, signal, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error(result.message || 'Your quote could not be sent. Please try again or call SK GARMENTS.');
}

export async function sendQuoteCopies(recipients: string[], payload: Record<string, string>, signal: AbortSignal) {
  const results = await Promise.all(recipients.map(async recipient => {
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (/activat|confirm.{0,30}email|verif/i.test(String(result.message || ''))) {
        return { recipient, reason: 'activation' } as const;
      }
      if (!response.ok || !(result.success === true || result.success === 'true')) {
        return { recipient, reason: 'rejected' } as const;
      }
      return { recipient, reason: null } as const;
    } catch {
      return { recipient, reason: 'network' } as const;
    }
  }));
  return {
    accepted: results.filter(result => result.reason === null).map(result => result.recipient),
    failures: results.filter((result): result is QuoteDeliveryFailure => result.reason !== null),
  };
}
