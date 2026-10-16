'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { storeRequest, type Customer } from '@/lib/store-api';

export default function InvitationForm({ token, onAccepted }: { token: string; onAccepted: (customer: Customer) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const confirmation = String(data.get('confirmation') || '');
    if (password !== confirmation) return setError('The passwords do not match.');
    setBusy(true); setError('');
    try {
      const customer = await storeRequest<Customer>('/invitation/accept', { method: 'POST', body: JSON.stringify({ token, password }) });
      onAccepted(customer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This invitation could not be accepted.');
    } finally { setBusy(false); }
  }
  return <div className="ss-auth"><div className="ss-auth-panel">
    <h3>Welcome to the private store.</h3><p>Set your password to activate your SK Apparel customer account.</p>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <label>Password<span className="ss-password"><input name="password" type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password" /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
      <label>Confirm password<input name="confirmation" type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password" /></label>
      {error && <p className="ss-error" role="alert">{error}</p>}
      <button type="submit" className="button dark full">{busy ? 'Activating account…' : 'Enter the Exclusive Store'}<ArrowUpRight size={19} aria-hidden="true" /></button>
    </fieldset></form>
    <p className="ss-help">Use at least 8 characters with uppercase, lowercase, number and symbol.</p>
  </div></div>;
}
