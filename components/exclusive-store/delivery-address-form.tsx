'use client';
import { useRef, useState, type FormEvent } from 'react';
import {
  StoreApiError,
  storeRequest,
  type Address,
  type Customer,
} from '@/lib/store-api';

export default function DeliveryAddressForm({
  customer,
  onSaved,
  onCancel,
  onExpired,
}: {
  customer: Customer;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  onExpired: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || '').trim();
    let phone = value('phone').replace(/[\s().-]/g, '');
    if (/^[6-9]\d{9}$/.test(phone)) phone = '+91' + phone;
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
      setError('Enter a valid phone number, including the country code.');
      return;
    }
    if (!/^[1-9]\d{5}$/.test(value('postalCode'))) {
      setError('Enter a valid six-digit PIN code.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const { address } = await storeRequest<{ address: Address }>(
        '/profile/addresses',
        {
          method: 'POST',
          body: JSON.stringify({
            recipientName: value('recipientName'),
            phone,
            addressLine1: value('addressLine1'),
            addressLine2: value('addressLine2'),
            city: value('city'),
            state: value('state'),
            postalCode: value('postalCode'),
            countryCode: 'IN',
            label: 'Home',
          }),
        },
      );
      onSaved(address);
    } catch (error) {
      if (error instanceof StoreApiError && error.status === 401) onExpired();
      else
        setError(
          error instanceof Error
            ? error.message
            : 'Could not save your address.',
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="ss-address-form" onSubmit={save}>
      <fieldset disabled={busy}>
        <legend>Delivery address</legend>
        <label>
          Full name
          <input
            name="recipientName"
            autoComplete="shipping name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={`${customer.firstName} ${customer.lastName}`}
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="shipping tel"
            required
            maxLength={20}
            placeholder="+91"
            defaultValue={customer.phone}
          />
        </label>
        <label>
          House, building and street
          <input
            name="addressLine1"
            autoComplete="shipping address-line1"
            required
            maxLength={150}
          />
        </label>
        <label>
          Area or landmark (optional)
          <input
            name="addressLine2"
            autoComplete="shipping address-line2"
            maxLength={150}
          />
        </label>
        <div className="ss-form-row">
          <label>
            City
            <input
              name="city"
              autoComplete="shipping address-level2"
              required
              maxLength={80}
            />
          </label>
          <label>
            State
            <input
              name="state"
              autoComplete="shipping address-level1"
              required
              maxLength={80}
            />
          </label>
        </div>
        <div className="ss-form-row">
          <label>
            PIN code
            <input
              name="postalCode"
              inputMode="numeric"
              autoComplete="shipping postal-code"
              pattern="[1-9][0-9]{5}"
              required
              maxLength={6}
            />
          </label>
          <div className="ss-address-country">
            <span>Country</span>
            <strong>India</strong>
          </div>
        </div>
        {error && (
          <p className="ss-error" role="alert">
            {error}
          </p>
        )}
        <div className="ss-address-form-actions">
          {onCancel && (
            <button type="button" className="button outline" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="button dark">
            {busy ? 'Saving…' : 'Save address'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
