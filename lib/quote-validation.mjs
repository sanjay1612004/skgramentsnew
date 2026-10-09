// Shared by the form and the email service so invalid requests cannot bypass the UI.
export const phoneCountries = [
  { code: 'IN', name: 'India', dial: '91', pattern: '[6-9][0-9]{9}', hint: 'a 10-digit mobile number starting with 6–9' },
  { code: 'US', name: 'United States', dial: '1', pattern: '[2-9][0-9]{2}[2-9][0-9]{6}', hint: 'a 10-digit phone number' },
  { code: 'CA', name: 'Canada', dial: '1', pattern: '[2-9][0-9]{2}[2-9][0-9]{6}', hint: 'a 10-digit phone number' },
  { code: 'GB', name: 'United Kingdom', dial: '44', pattern: '[1-9][0-9]{8,9}', hint: 'a 9–10 digit number without the leading 0' },
  { code: 'AU', name: 'Australia', dial: '61', pattern: '[2-478][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'NZ', name: 'New Zealand', dial: '64', pattern: '[1-9][0-9]{7,9}', hint: 'an 8–10 digit number without the leading 0' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971', pattern: '[2-9][0-9]{7,8}', hint: 'an 8–9 digit number without the leading 0' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'QA', name: 'Qatar', dial: '974', pattern: '[3-7][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'KW', name: 'Kuwait', dial: '965', pattern: '[2569][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'OM', name: 'Oman', dial: '968', pattern: '[279][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'BH', name: 'Bahrain', dial: '973', pattern: '[136][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'SG', name: 'Singapore', dial: '65', pattern: '[3689][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'MY', name: 'Malaysia', dial: '60', pattern: '[1-9][0-9]{7,9}', hint: 'an 8–10 digit number without the leading 0' },
  { code: 'ID', name: 'Indonesia', dial: '62', pattern: '[1-9][0-9]{7,11}', hint: 'an 8–12 digit number without the leading 0' },
  { code: 'PH', name: 'Philippines', dial: '63', pattern: '[1-9][0-9]{8,9}', hint: 'a 9–10 digit number without the leading 0' },
  { code: 'TH', name: 'Thailand', dial: '66', pattern: '[1-9][0-9]{7,8}', hint: 'an 8–9 digit number without the leading 0' },
  { code: 'VN', name: 'Vietnam', dial: '84', pattern: '[1-9][0-9]{8,9}', hint: 'a 9–10 digit number without the leading 0' },
  { code: 'CN', name: 'China', dial: '86', pattern: '[1-9][0-9]{9,10}', hint: 'a 10–11 digit phone number' },
  { code: 'HK', name: 'Hong Kong', dial: '852', pattern: '[2-9][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'JP', name: 'Japan', dial: '81', pattern: '[1-9][0-9]{8,9}', hint: 'a 9–10 digit number without the leading 0' },
  { code: 'KR', name: 'South Korea', dial: '82', pattern: '[1-9][0-9]{7,9}', hint: 'an 8–10 digit number without the leading 0' },
  { code: 'LK', name: 'Sri Lanka', dial: '94', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'BD', name: 'Bangladesh', dial: '880', pattern: '[1-9][0-9]{9}', hint: 'a 10-digit number without the leading 0' },
  { code: 'NP', name: 'Nepal', dial: '977', pattern: '[1-9][0-9]{7,9}', hint: 'an 8–10 digit phone number' },
  { code: 'PK', name: 'Pakistan', dial: '92', pattern: '[1-9][0-9]{9}', hint: 'a 10-digit number without the leading 0' },
  { code: 'DE', name: 'Germany', dial: '49', pattern: '[1-9][0-9]{6,12}', hint: 'a 7–13 digit number without the leading 0' },
  { code: 'FR', name: 'France', dial: '33', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'IT', name: 'Italy', dial: '39', pattern: '[0-9]{6,11}', hint: 'a 6–12 digit phone number' },
  { code: 'ES', name: 'Spain', dial: '34', pattern: '[6-9][0-9]{8}', hint: 'a 9-digit phone number' },
  { code: 'PT', name: 'Portugal', dial: '351', pattern: '[2-9][0-9]{8}', hint: 'a 9-digit phone number' },
  { code: 'NL', name: 'Netherlands', dial: '31', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'BE', name: 'Belgium', dial: '32', pattern: '[1-9][0-9]{7,8}', hint: 'an 8–9 digit number without the leading 0' },
  { code: 'CH', name: 'Switzerland', dial: '41', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'SE', name: 'Sweden', dial: '46', pattern: '[1-9][0-9]{6,9}', hint: 'a 7–10 digit number without the leading 0' },
  { code: 'NO', name: 'Norway', dial: '47', pattern: '[2-9][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'DK', name: 'Denmark', dial: '45', pattern: '[2-9][0-9]{7}', hint: 'an 8-digit phone number' },
  { code: 'PL', name: 'Poland', dial: '48', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit phone number' },
  { code: 'TR', name: 'Türkiye', dial: '90', pattern: '[2-5][0-9]{9}', hint: 'a 10-digit number without the leading 0' },
  { code: 'ZA', name: 'South Africa', dial: '27', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'NG', name: 'Nigeria', dial: '234', pattern: '[1-9][0-9]{9}', hint: 'a 10-digit number without the leading 0' },
  { code: 'KE', name: 'Kenya', dial: '254', pattern: '[1-9][0-9]{8}', hint: 'a 9-digit number without the leading 0' },
  { code: 'EG', name: 'Egypt', dial: '20', pattern: '[1-9][0-9]{8,9}', hint: 'a 9–10 digit number without the leading 0' },
  { code: 'BR', name: 'Brazil', dial: '55', pattern: '[1-9][0-9]{9,10}', hint: 'a 10–11 digit phone number' },
  { code: 'MX', name: 'Mexico', dial: '52', pattern: '[1-9][0-9]{9}', hint: 'a 10-digit phone number' },
].sort((a, b) => a.code === 'IN' ? -1 : b.code === 'IN' ? 1 : a.name.localeCompare(b.name));

/** @param {string} phone @param {string} countryCode */
export function nationalPhone(phone, countryCode) {
  const country = phoneCountries.find(country => country.code === countryCode);
  const digits = phone.replace(/[^0-9]/g, '');
  return country && phone.trim().startsWith('+') && digits.startsWith(country.dial)
    ? digits.slice(country.dial.length) : digits;
}

/** @param {string} phone @param {string} countryCode */
export function internationalPhone(phone, countryCode) {
  const country = phoneCountries.find(country => country.code === countryCode);
  return country ? `+${country.dial}${nationalPhone(phone, countryCode)}` : '';
}

/**
 * @param {{email: string, phone: string, country: string, subject: string, message: string}} values
 * @returns {Partial<Record<'email' | 'phone' | 'country' | 'subject' | 'message', string>>}
 */
export function validateQuoteFields(values) {
  const errors = {};
  const { email, phone, subject, message } = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
  const country = phoneCountries.find(country => country.code === values.country);
  const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
  if (!email) errors.email = 'Enter your email address so we can reply.';
  else if (email.length > 254 || !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(email) || email.split('@')[0].length > 64 || email.startsWith('.') || email.includes('..') || email.includes('.@')) errors.email = 'Enter a valid email address, like you@example.com.';
  if (!country) errors.country = 'Choose a country code from the list.';
  if (!phone) errors.phone = 'Enter your phone number so we can contact you.';
  else if (country) {
    const digits = nationalPhone(phone, country.code);
    if (!/^\+?[0-9 ()\-.]+$/.test(phone) || phone.length > 30 || (phone.startsWith('+') && !phone.replace(/[^0-9]/g, '').startsWith(country.dial)) || !new RegExp(`^(?:${country.pattern})$`).test(digits) || digits.length + country.dial.length > 15 || /^(\d)\1+$/.test(digits)) errors.phone = `For ${country.name}, enter ${country.hint}.`;
  }
  if (!subject) errors.subject = 'Add a subject for your quote request.';
  else if (subject.length < 3 || subject.length > 160 || !/[\p{L}\p{N}]/u.test(subject) || /[\r\n]/.test(subject) || controls.test(subject)) errors.subject = 'Use 3–160 characters with at least one letter or number.';
  if (!message) errors.message = 'Tell us a little about what you need.';
  else if (message.length < 10 || message.length > 2000 || !/[\p{L}\p{N}]/u.test(message) || controls.test(message)) errors.message = 'Use 10–2,000 characters with at least one letter or number.';
  return errors;
}
