export const site = {
  name: 'SK GARMENTS', logo: 'SK', tagline: 'Wear what feels like you.',
  origin: 'https://sk-garments-studio.sanjaybalaji-k.chatgpt.site',
  description: 'Discover premium T-shirts, oversized fits, graphic tees, and everyday essentials from SK GARMENTS. Contemporary clothing designed for comfort, style, and individuality.',
  contact: { phone: '9344856330', whatsapp: '9344856330', email: 's.kishorebabu8@gmail.com', address: 'Door 17, Amarajyothi Nagar, Samundipuram', city: 'Tiruppur, Tamil Nadu 641603', hours: 'Contact us for current opening hours.', hoursSourceText: 'User-supplied listing: Closes soon · 8 pm · Opens 9 am Mon. Full weekly schedule not confirmed.', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Door%2017%2C%20Amarajyothi%20Nagar%2C%20Samundipuram%2C%20Tiruppur%2C%20Tamil%20Nadu%20641603', instagram: 'https://www.instagram.com/skgarments/', tiktok: '', externalCheckout: '' },
  flags: { showTeam: false, showReviews: false, showStatistics: false, showStore: true },
  team: [] as { name: string; role: string; image: string }[],
  testimonials: [] as { quote: string; author: string }[],
  statistics: [] as { value: string; label: string }[],
  shipping: 'Shipping and payment options depend on your location and selected ordering method. Ask for the current options before placing an order.',
  returns: 'Exchange and return terms will be confirmed with your enquiry before an order is placed.',
  about: { establishedYear: 2016, ordersHandled: 200, workshopCopy: 'Our shop is where ideas become garments. From everyday T-shirts to custom printing and embroidered details, we bring your requirements into the conversation and help you find a style that feels like yours.' },
  story: 'Established in 2016, SK GARMENTS is based in Tiruppur, Tamil Nadu. With 200+ orders handled, our story is built around the garments we make and the people we make them for.',
  copy: {
    hero: ['WEAR', 'YOUR', 'ATTITUDE.'], intro: 'We make the T-shirts you reach for first.', introBody: 'Good fabric. Better fits. Strong graphics. No unnecessary noise.',
    heroBody: 'Premium everyday T-shirts designed for comfort, expression, and effortless style. Welcome to SK GARMENTS.',
    brandBody: 'SK GARMENTS creates contemporary everyday clothing designed to feel effortless from the moment you put it on.',
    final: 'YOUR NEXT FAVORITE TEE IS RIGHT HERE.',
    principles: [
      { word: 'FIT', text: 'Built around silhouettes that actually feel good to wear.', color: '#c7c0e5' },
      { word: 'FABRIC', text: 'Soft where it matters. Structured where it counts.', color: '#d4ed92' },
      { word: 'DETAIL', text: 'From stitching to print placement, small things change everything.', color: '#efac85' },
      { word: 'ATTITUDE', text: 'Clothes shouldn’t tell you who to be. They should help you show it.', color: '#24251f' }
    ],
    fabric: { headline: 'FEEL THE DIFFERENCE.', text: 'The little things you feel. Every time you wear it.', specifications: ['Weight, composition, and care details are confirmed for each product before ordering.'] }
  },
  privacy: 'When you submit a quote, your email and message are sent through FormSubmit to SK GARMENTS so we can respond. FormSubmit processes the submission under its privacy policy. Other enquiry links use the selected external contact service.',
  terms: 'The displayed collection and imagery are concepts. Availability, product specifications, prices, payment, shipping, and returns must be confirmed directly with SK GARMENTS. Preparing an enquiry does not confirm an order.'
};
export const fits = [
  { id: 'Regular', label: 'A little structure. A lot of everyday.', description: 'A straighter silhouette that sits closer to the body. Choose your usual size for a classic fit.', x: .83, y: 1 },
  { id: 'Relaxed', label: 'Room to move.', description: 'More ease through the chest and sleeves. An easy middle ground between regular and oversized.', x: .94, y: 1 },
  { id: 'Oversized', label: 'Big proportions. Easy energy.', description: 'A roomy body, generous sleeves, and dropped shoulders. Choose your usual size for the intended look.', x: 1.1, y: 1.04 },
  { id: 'Boxy', label: 'Wide. Clean. Considered.', description: 'A wider body with a shorter length. Check the product measurements to get the proportions right.', x: 1.08, y: .87 }
];
