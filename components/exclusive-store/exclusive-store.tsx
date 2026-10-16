'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { StoreApiError, storeRequest, exclusiveLink, type Customer } from '@/lib/store-api';
import AuthForm from './auth-form';
import InvitationForm from './invitation-form';
import ExclusiveCatalog from './exclusive-catalog';
import ExclusiveProduct from './exclusive-product';
import SharedBag from './shared-bag';
import StoreDialog from './store-dialog';
import CustomerAvatar from './customer-avatar';
import ProfileActions from './profile-actions';
import ProfilePopover from './profile-popover';
import { useStoreCart } from './use-store-cart';
import ExclusiveCheckout from './exclusive-checkout';
import OrderConfirmation from './order-confirmation';
import OrderHistory from './order-history';

type Session = { status: 'checking' } | { status: 'guest' } | { status: 'error'; message: string } | { status: 'blocked'; message: string } | { status: 'authenticated'; customer: Customer };

export default function ExclusiveStore() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get('category') || '';
  const product = params.get('product') || '';
  const showBag = params.get('bag') === '1';
  const showCheckout = params.get('checkout') === '1';
  const order = params.get('order') || '';
  const showOrders = params.get('orders') === '1';
  const invitation = params.get('invite') || '';
  const number = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(number) && number > 0 ? number : 1;
  const [session, setSession] = useState<Session>({ status: 'checking' });
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [modal, setModal] = useState<'login' | 'profile' | null>(null);
  const closeModal = useCallback(() => setModal(null), []);
  const sessionGeneration = useRef(0);
  const profileAnchor = useRef<HTMLDivElement>(null);

  const acceptCustomer = useCallback((customer: Customer, close = true) => {
    if (close) sessionGeneration.current++;
    setSession(customer.roles?.includes('customer') ? { status: 'authenticated', customer } : { status: 'blocked', message: 'Please use a customer account to access the exclusive store.' });
    if (close) setModal(null);
  }, []);
  const acceptInvitation = useCallback((customer: Customer) => {
    sessionGeneration.current++;
    setSession({ status: 'authenticated', customer });
    router.replace(exclusiveLink());
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    const check = async () => {
      const generation = sessionGeneration.current;
      try {
        const customer = await storeRequest<Customer>('/profile', { signal: controller.signal });
        if (!controller.signal.aborted && generation === sessionGeneration.current) acceptCustomer(customer, false);
      } catch (error) {
        if (controller.signal.aborted || generation !== sessionGeneration.current) return;
        if (error instanceof StoreApiError && error.status === 401) { setSession({ status: 'guest' }); if (!invitation) setModal('login'); }
        else setSession({ status: 'error', message: error instanceof Error ? error.message : 'Could not check your account.' });
      }
    };
    void check();
    window.addEventListener('focus', check);
    return () => { controller.abort(); window.removeEventListener('focus', check); };
  }, [retry, acceptCustomer, invitation]);

  const expired = useCallback(() => { sessionGeneration.current++; setSession({ status: 'guest' }); setModal('login'); }, []);
  const cart = useStoreCart(session.status === 'authenticated' ? session.customer._id : '', expired);
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true); setLogoutError('');
    try {
      await storeRequest('/logout', { method: 'POST' });
      sessionGeneration.current++;
      setSession({ status: 'guest' });
      setModal(null);
      router.replace('/');
    }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'Could not sign out. Please try again.'); }
    finally { setLoggingOut(false); }
  }

  return <>
    <header className="ss-navigation">
      <Link href="/" className="logo" aria-label="THE SK APPARELS home">THE SK<span>APPARELS</span></Link>
      <nav aria-label="Exclusive store account" className="ss-navigation-actions">
        {session.status === 'authenticated' ? <Link href={exclusiveLink({ bag: 1 })} className="ss-nav-icon" aria-label="Shopping bag"><ShoppingBag size={23} aria-hidden="true" />{Boolean(cart.cart?.summary.itemCount) && <span className="ss-bag-dot" role="status" aria-label={`${cart.cart!.summary.itemCount} ${cart.cart!.summary.itemCount === 1 ? 'item' : 'items'} in bag`} />}</Link> : <button type="button" className="ss-nav-icon" aria-label="Shopping bag" disabled={session.status === 'checking'} onClick={() => setModal('login')}><ShoppingBag size={23} aria-hidden="true" /></button>}
        <div className="ss-profile-anchor" ref={profileAnchor}>
          <button type="button" className="ss-nav-profile" aria-label={session.status === 'authenticated' ? 'Open profile menu' : 'Sign in'} aria-haspopup="dialog" aria-expanded={modal === 'profile'} disabled={session.status === 'checking'} onClick={() => setModal(session.status === 'authenticated' ? modal === 'profile' ? null : 'profile' : 'login')}><CustomerAvatar customer={session.status === 'authenticated' ? session.customer : undefined} /></button>
          {modal === 'profile' && session.status === 'authenticated' && <ProfilePopover anchor={profileAnchor} onClose={closeModal}><ProfileActions customer={session.customer} onSaved={acceptCustomer} onLogout={logout} onExpired={expired} onNavigate={closeModal} loggingOut={loggingOut} logoutError={logoutError} /></ProfilePopover>}
        </div>
      </nav>
    </header>
    <main id="main" className="ss-page">
      {session.status === 'checking' ? <div className="ss-loading" role="status">Checking your account…</div> : invitation && session.status === 'guest' ? <InvitationForm token={invitation} onAccepted={acceptInvitation} /> : session.status === 'guest' ? <div className="ss-guest"><p>Sign in to browse the exclusive collection.</p><button type="button" className="button dark" onClick={() => setModal('login')}>Sign in</button></div> : session.status === 'error' || session.status === 'blocked' ? <div className="ss-message" role="alert"><h2>{session.status === 'blocked' ? 'Customer access only.' : 'Let’s try that again.'}</h2><p>{session.message}</p><button className="button dark" onClick={() => setRetry((value) => value + 1)}>Try again</button><button className="button outline" onClick={() => setModal('login')}>Use another account</button></div> : <>
        {order ? <OrderConfirmation key={order} identifier={order} onExpired={expired} /> : showOrders ? <OrderHistory key={page} page={page} onExpired={expired} /> : showCheckout ? <ExclusiveCheckout onExpired={expired} cartResource={cart} /> : showBag ? <SharedBag resource={cart} /> : product ? <ExclusiveProduct key={product} identifier={product} onExpired={expired} onAdd={cart.addItem} cartBusy={Boolean(cart.busy)} /> : <ExclusiveCatalog key={`${category}:${page}`} category={category} page={page} onExpired={expired} />}
      </>}
    </main>
    {modal === 'login' && <StoreDialog title="Your account" onClose={closeModal}><AuthForm onSignedIn={acceptCustomer} /></StoreDialog>}
  </>;
}
