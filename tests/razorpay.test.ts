import { afterEach, expect, it, vi } from 'vitest';
import { payWithRazorpay } from '../lib/razorpay';
import { storeRequest } from '../lib/store-api';
vi.mock('../lib/store-api', () => ({ storeRequest: vi.fn() }));
afterEach(() => { delete window.Razorpay; vi.resetAllMocks(); });
it('sends gateway callback references to the server and returns only the verified order', async () => {
  const proof = { razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: 'signed' };
  vi.mocked(storeRequest).mockResolvedValueOnce({ key: 'rzp_test_public', order_id: 'order_test', amount: 105900, currency: 'INR' }).mockResolvedValueOnce({ order: { _id: 'store-id', paymentStatus: 'paid' } });
  window.Razorpay = class {
    constructor(private options: { handler: (result: typeof proof) => void }) {}
    open() { this.options.handler(proof); }
    on() {}
  };
  expect(await payWithRazorpay('store-id')).toEqual({ _id: 'store-id', paymentStatus: 'paid' });
  expect(storeRequest).toHaveBeenLastCalledWith('/orders/store-id/payment/verify', { method: 'POST', body: JSON.stringify(proof) });
});
it('keeps an unpaid order resumable when the customer dismisses checkout', async () => {
  vi.mocked(storeRequest).mockResolvedValueOnce({ key: 'rzp_test_public', order_id: 'order_test' });
  window.Razorpay = class {
    constructor(private options: { modal: { ondismiss: () => void } }) {}
    open() { this.options.modal.ondismiss(); }
    on() {}
  };
  await expect(payWithRazorpay('store-id')).rejects.toThrow('retry from this order');
  expect(storeRequest).toHaveBeenCalledTimes(1);
});
