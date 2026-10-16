'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StoreApiError, storeRequest, type Cart } from '@/lib/store-api';

type State = {
  customerId: string;
  cart: Cart | null;
  loading: boolean;
  busy: string;
  error: string;
};
type Session = {
  customerId: string;
  active: boolean;
  busy: boolean;
  version: number;
  read?: AbortController;
  write?: AbortController;
};
export function useStoreCart(customerId: string, onExpired: () => void) {
  const [state, setState] = useState<State>({
    customerId: '',
    cart: null,
    loading: false,
    busy: '',
    error: '',
  });
  const session = useRef<Session | null>(null);
  const refresh = useCallback(
    async (skipPending = false) => {
      const current = session.current;
      if (!current?.active || current.busy) return null;
      if (skipPending && current.read && !current.read.signal.aborted)
        return null;
      current.read?.abort();
      const controller = new AbortController();
      current.read = controller;
      const version = ++current.version;
      setState((old) => ({
        customerId: current.customerId,
        cart: old.customerId === current.customerId ? old.cart : null,
        busy: '',
        loading: true,
        error: '',
      }));
      try {
        const { cart } = await storeRequest<{ cart: Cart }>('/cart', {
          signal: controller.signal,
        });
        if (
          !current.active ||
          controller.signal.aborted ||
          current.version !== version
        )
          return null;
        setState({
          customerId: current.customerId,
          cart,
          loading: false,
          busy: '',
          error: '',
        });
        return cart;
      } catch (error) {
        if (
          !current.active ||
          controller.signal.aborted ||
          current.version !== version
        )
          return null;
        if (error instanceof StoreApiError && error.status === 401) onExpired();
        setState((old) => ({
          ...old,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Could not load your bag.',
        }));
        return null;
      } finally {
        if (current.read === controller) current.read = undefined;
      }
    },
    [onExpired],
  );
  useEffect(() => {
    if (!customerId) return;
    const current: Session = {
      customerId,
      active: true,
      busy: false,
      version: 0,
    };
    session.current = current;
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      current.active = false;
      current.read?.abort();
      current.write?.abort();
      window.removeEventListener('focus', onFocus);
    };
  }, [customerId, refresh]);
  const mutate = useCallback(
    async (path: string, method: string, busy: string, body?: object) => {
      const current = session.current;
      if (!current?.active)
        throw new StoreApiError('Please sign in again.', 401);
      if (current.busy)
        throw new StoreApiError('Your bag is being updated. Please wait.');
      current.busy = true;
      current.version++;
      current.read?.abort();
      const controller = new AbortController();
      current.write = controller;
      setState((old) => ({
        ...old,
        customerId: current.customerId,
        busy,
        loading: false,
        error: '',
      }));
      try {
        const { cart } = await storeRequest<{ cart: Cart }>(path, {
          method,
          signal: controller.signal,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!current.active || controller.signal.aborted)
          throw new DOMException('Request cancelled', 'AbortError');
        setState({
          customerId: current.customerId,
          cart,
          loading: false,
          busy: '',
          error: '',
        });
        return cart;
      } catch (error) {
        if (current.active && !controller.signal.aborted) {
          if (error instanceof StoreApiError && error.status === 401)
            onExpired();
          setState((old) => ({
            ...old,
            busy: '',
            error:
              error instanceof Error
                ? error.message
                : 'Could not update your bag.',
          }));
        }
        throw error;
      } finally {
        current.busy = false;
      }
    },
    [onExpired],
  );
  const addItem = useCallback(
    (variantId: string) =>
      mutate('/cart/items', 'POST', variantId, { variantId, quantity: 1 }),
    [mutate],
  );
  const changeItem = useCallback(
    (variantId: string, quantity?: number) =>
      mutate(
        '/cart/items/' + encodeURIComponent(variantId),
        quantity === undefined ? 'DELETE' : 'PATCH',
        variantId,
        quantity === undefined ? undefined : { quantity },
      ),
    [mutate],
  );
  return {
    ...(state.customerId === customerId
      ? state
      : {
          customerId,
          cart: null,
          loading: Boolean(customerId),
          busy: '',
          error: '',
        }),
    refresh,
    addItem,
    changeItem,
  };
}
export type StoreCart = ReturnType<typeof useStoreCart>;
