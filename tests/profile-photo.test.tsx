import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfileActions from '../components/exclusive-store/profile-actions';
import type { Customer } from '../lib/store-api';

const customer: Customer = { _id: 'customer', firstName: 'Photo', lastName: 'Customer', emailId: 'photo@example.com', roles: ['customer'] };
const photoUrl = 'https://example.com/profile.png';
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_STORE_API_URL', 'https://api.example.com'));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function mount(user = customer) {
  const onSaved = vi.fn(); const onExpired = vi.fn();
  render(<ProfileActions customer={user} onSaved={onSaved} onExpired={onExpired} onLogout={vi.fn()} onNavigate={vi.fn()} loggingOut={false} logoutError="" />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  return { onSaved, onExpired };
}
it('uploads a selected photo with its MIME type and cookies without closing the editor', async () => {
  const updated = { ...customer, avatarUrl: photoUrl };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: updated }), { status: 201 }));
  vi.stubGlobal('fetch', fetch);
  const { onSaved } = mount();
  const file = new File(['photo'], 'profile.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Profile photo'), { target: { files: [file] } });
  await screen.findByRole('status');
  expect(fetch).toHaveBeenCalledWith('https://api.example.com/profile/photo', expect.objectContaining({
    method: 'POST', body: file, credentials: 'include', headers: expect.objectContaining({ 'Content-Type': 'image/png' }),
  }));
  expect(onSaved).toHaveBeenCalledWith(updated, false);
});
it('rejects unsupported and oversized files before sending them', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  mount();
  const input = screen.getByLabelText('Profile photo');
  fireEvent.change(input, { target: { files: [new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPEG');
  fireEvent.change(input, { target: { files: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('up to 5 MB');
  expect(fetch).not.toHaveBeenCalled();
});
it('keeps the current photo when upload fails and allows retry', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Storage unavailable' }), { status: 502 }));
  vi.stubGlobal('fetch', fetch);
  const { onSaved } = mount({ ...customer, avatarUrl: photoUrl });
  fireEvent.change(screen.getByLabelText('Profile photo'), { target: { files: [new File(['photo'], 'profile.png', { type: 'image/png' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable');
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Remove photo' })).toBeEnabled();
});
it('removes a photo and reports expired sessions', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ user: customer }))).mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Sign in again' }), { status: 401 }));
  vi.stubGlobal('fetch', fetch);
  const { onSaved, onExpired } = mount({ ...customer, avatarUrl: photoUrl });
  fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(customer, false));
  expect(fetch).toHaveBeenCalledWith('https://api.example.com/profile/photo', expect.objectContaining({ method: 'DELETE' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
  await waitFor(() => expect(onExpired).toHaveBeenCalledOnce());
});
