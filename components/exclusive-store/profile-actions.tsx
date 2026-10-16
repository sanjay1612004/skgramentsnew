'use client';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Pencil, LogOut, Package } from 'lucide-react';
import Link from 'next/link';
import { StoreApiError, storeRequest, exclusiveLink, type Customer } from '@/lib/store-api';
import CustomerAvatar from './customer-avatar';

export default function ProfileActions({ customer, onSaved, onLogout, onExpired, onNavigate, loggingOut, logoutError }: { customer: Customer; onSaved: (customer: Customer, close?: boolean) => void; onLogout: () => void; onExpired: () => void; onNavigate: () => void; loggingOut: boolean; logoutError: string }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoMessage, setPhotoMessage] = useState('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (editing) form.current?.querySelector<HTMLInputElement>('input')?.focus(); }, [editing]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(['firstName', 'lastName', 'phone'].map((key) => [key, String(data.get(key) || '').trim()]));
    setBusy(true); setError('');
    try { const result = await storeRequest<{ user: Customer }>('/profile/edit', { method: 'PATCH', body: JSON.stringify(payload) }); onSaved(result.user); }
    catch (error) { if (error instanceof StoreApiError && error.status === 401) onExpired(); else setError(error instanceof Error ? error.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }
  async function updatePhoto(file?: File) {
    if (busy) return;
    setError(''); setPhotoMessage('');
    if (file && !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP, or AVIF image.'); return;
    }
    if (file && (!file.size || file.size > 5 * 1024 * 1024)) {
      setError('Choose an image up to 5 MB.'); return;
    }
    setBusy(true);
    try {
      const result = await storeRequest<{ user: Customer }>('/profile/photo', file
        ? { method: 'POST', body: file, headers: { 'Content-Type': file.type }, signal: AbortSignal.timeout(60000) }
        : { method: 'DELETE' });
      onSaved(result.user, false);
      setPhotoMessage(file ? 'Profile photo updated.' : 'Profile photo removed.');
    } catch (error) {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else setError(error instanceof Error ? error.message : 'Could not update your photo. Please try again.');
    } finally { setBusy(false); }
  }
  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) void updatePhoto(file);
  }
  return <div className="ss-profile-actions">
    <div className="ss-profile-summary"><CustomerAvatar customer={customer} /><div><h3>{customer.firstName} {customer.lastName}</h3><p>{customer.emailId}</p></div></div>
    {editing ? <form ref={form} className="ss-auth ss-profile-form" onSubmit={save}><fieldset disabled={busy}>
      <div className="ss-form-row"><label>First name<input name="firstName" required minLength={2} defaultValue={customer.firstName} autoComplete="given-name" /></label><label>Last name<input name="lastName" required defaultValue={customer.lastName} autoComplete="family-name" /></label></div>
      <label>Phone with country code<input name="phone" type="tel" defaultValue={customer.phone || ''} placeholder="+919876543210" autoComplete="tel" /></label>
      <div className="ss-photo-controls">
        <label>Profile photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={choosePhoto} aria-describedby="ss-photo-help" /></label>
        <p id="ss-photo-help">JPEG, PNG, WebP or AVIF, up to 5 MB. Photos save immediately.</p>
        {customer.avatarUrl && <button type="button" className="button outline" onClick={() => updatePhoto()}>Remove photo</button>}
        {photoMessage && <p role="status">{photoMessage}</p>}
      </div>
      {error && <p className="ss-error" role="alert">{error}</p>}
      <div className="ss-profile-form-buttons"><button type="button" className="button outline" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="button dark">{busy ? 'Saving…' : 'Save profile'}</button></div>
    </fieldset></form> : <div className="ss-profile-menu"><Link href={exclusiveLink({ orders: 1 })} onClick={onNavigate}><Package size={18} aria-hidden="true" />Your orders</Link><button type="button" onClick={() => setEditing(true)} disabled={loggingOut}><Pencil size={18} aria-hidden="true" /> Edit profile</button><button type="button" onClick={onLogout} disabled={loggingOut}><LogOut size={18} aria-hidden="true" />{loggingOut ? 'Signing out…' : 'Sign out'}</button></div>}
    {logoutError && <p className="ss-error" role="alert">{logoutError}</p>}
  </div>;
}
