'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { storeRequest, type Customer } from '@/lib/store-api';

export default function AuthForm({ onSignedIn }: { onSignedIn: (customer: Customer) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const emailId = String(data.get('emailId')).trim();
    const password = String(data.get('password'));
    setBusy(true); setError('');
    try {
      const customer = await storeRequest<Customer>('/login', { method: 'POST', body: JSON.stringify({ emailId, password }) });
      // Confirm the browser accepted the HttpOnly session cookie before loading private data.
      await storeRequest<Customer>('/profile');
      form.reset();
      onSignedIn(customer);
    } catch (error) { setError(error instanceof Error ? error.message : 'We could not sign you in. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="ss-auth">
    <div className="ss-auth-panel"><h3>Welcome back.</h3><p>Sign in with your existing customer account.</p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>Email address<input name="emailId" type="email" required autoComplete="email" /></label>
          <label>Password<span className="ss-password"><input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
          {error && <p className="ss-error" role="alert">{error}</p>}
          <button type="submit" className="button dark full">{busy ? 'Please wait…' : 'Enter the exclusive store'}<ArrowUpRight size={19} aria-hidden="true" /></button>
        </fieldset>
      </form>
      <p className="ss-help">Your account and shopping bag are shared with our store.</p>
    </div>
  </div>;
}
