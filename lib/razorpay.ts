import { storeRequest, type Order } from './store-api';
type PaymentResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Options = { key: string; order_id: string; amount: number; currency: string; name: string; description: string; handler: (result: PaymentResult) => void; modal: { ondismiss: () => void } };
declare global { interface Window { Razorpay?: new (options: Options) => { open: () => void; on: (event: string, callback: () => void) => void } } }
let loading: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  loading ||= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => window.Razorpay ? resolve() : reject(new Error('Payment checkout could not load. Please retry.'));
    script.onerror = () => { script.remove(); reject(new Error('Payment checkout could not load. Please retry.')); };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
export async function payWithRazorpay(orderId: string): Promise<Order> {
  await loadCheckout();
  const path = '/orders/' + encodeURIComponent(orderId);
  const options = await storeRequest<Omit<Options, 'handler' | 'modal'>>(path + '/payment', { method: 'POST' });
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({ ...options,
      handler: result => { void storeRequest<{ order: Order }>(path + '/payment/verify', { method: 'POST', body: JSON.stringify(result) }).then(data => resolve(data.order)).catch(reject); },
      modal: { ondismiss: () => reject(new Error('Payment window closed. You can retry from this order.')) },
    });
    checkout.open();
  });
}
