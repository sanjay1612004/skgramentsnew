'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil, LogOut } from 'lucide-react';
import { StoreApiError, storeRequest, type Customer } from '@/lib/store-api';
import CustomerAvatar from './customer-avatar';

export default function ProfileActions({ customer, onSaved, onLogout, onExpired, loggingOut, logoutError }: { customer: Customer; onSaved: (customer: Customer) => void; onLogout: () => void; onExpired: () => void; loggingOut: boolean; logoutError: string }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (editing) form.current?.querySelector<HTMLInputElement>('input')?.focus(); }, [editing]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(['firstName', 'lastName', 'phone', 'avatarUrl'].map((key) => [key, String(data.get(key) || '').trim()]));
    setBusy(true); setError('');
    try { const result = await storeRequest<{ user: Customer }>('/profile/edit', { method: 'PATCH', body: JSON.stringify(payload) }); onSaved(result.user); }
    catch (error) { if (error instanceof StoreApiError && error.status === 401) onExpired(); else setError(error instanceof Error ? error.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }
  return <div className="ss-profile-actions">
    <div className="ss-profile-summary"><CustomerAvatar customer={customer} /><div><h3>{customer.firstName} {customer.lastName}</h3><p>{customer.emailId}</p></div></div>
    {editing ? <form ref={form} className="ss-auth ss-profile-form" onSubmit={save}><fieldset disabled={busy}>
      <div className="ss-form-row"><label>First name<input name="firstName" required minLength={2} defaultValue={customer.firstName} autoComplete="given-name" /></label><label>Last name<input name="lastName" required defaultValue={customer.lastName} autoComplete="family-name" /></label></div>
      <label>Phone with country code<input name="phone" type="tel" defaultValue={customer.phone || ''} placeholder="+919876543210" autoComplete="tel" /></label>
      <label>Profile picture URL<input name="avatarUrl" type="url" defaultValue={customer.avatarUrl || ''} placeholder="https://…" /></label>
      {error && <p className="ss-error" role="alert">{error}</p>}
      <div className="ss-profile-form-buttons"><button type="button" className="button outline" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="button dark">{busy ? 'Saving…' : 'Save profile'}</button></div>
    </fieldset></form> : <div className="ss-profile-menu"><button type="button" onClick={() => setEditing(true)} disabled={loggingOut}><Pencil size={18} aria-hidden="true" /> Edit profile</button><button type="button" onClick={onLogout} disabled={loggingOut}><LogOut size={18} aria-hidden="true" />{loggingOut ? 'Signing out…' : 'Sign out'}</button></div>}
    {logoutError && <p className="ss-error" role="alert">{logoutError}</p>}
  </div>;
}
