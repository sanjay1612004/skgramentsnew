import { site } from '@/data/site';

export function getWhatsAppUrl(message = 'Hi THE SK APPARELS, I would like to enquire about your garments and get a quote.') {
  const digits = site.contact.whatsapp.replace(/\D/g, '');
  // Local Indian numbers need the country code for WhatsApp click-to-chat.
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
