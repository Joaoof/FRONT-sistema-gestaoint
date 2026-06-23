import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  GET_WEB_PUSH_PUBLIC_KEY,
  SUBSCRIBE_WEB_PUSH,
  UNSUBSCRIBE_WEB_PUSH,
} from '../graphql/queries/calendar';

type Status =
  | 'unsupported'
  | 'not-configured'
  | 'denied'
  | 'unsubscribed'
  | 'subscribed';

const SW_URL = '/sw-push.js';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useWebPush() {
  const [status, setStatus] = useState<Status>('unsubscribed');
  const [busy, setBusy] = useState(false);
  const client = useApolloClient();

  const { data, loading: loadingKey } = useQuery<{ webPushPublicKey: string | null }>(
    GET_WEB_PUSH_PUBLIC_KEY,
    { fetchPolicy: 'cache-first' },
  );
  const publicKey = data?.webPushPublicKey ?? null;

  const [subscribe] = useMutation(SUBSCRIBE_WEB_PUSH);
  const [unsubscribeMut] = useMutation(UNSUBSCRIBE_WEB_PUSH);

  const supported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window,
    [],
  );

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    if (loadingKey) return;
    if (!publicKey) {
      setStatus('not-configured');
      return;
    }
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register(SW_URL);
        const existing = await reg.pushManager.getSubscription();
        setStatus(existing ? 'subscribed' : 'unsubscribed');
      } catch {
        setStatus('unsubscribed');
      }
    })();
  }, [supported, publicKey, loadingKey]);

  const enable = useCallback(async () => {
    if (!supported || !publicKey) return false;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'unsubscribed');
        return false;
      }
      const reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await subscribe({
        variables: {
          input: {
            endpoint: json.endpoint!,
            p256dh: bufferToB64Url(sub.getKey('p256dh')),
            auth: bufferToB64Url(sub.getKey('auth')),
            userAgent: navigator.userAgent.slice(0, 200),
          },
        },
      });
      setStatus('subscribed');
      return true;
    } finally {
      setBusy(false);
    }
  }, [supported, publicKey, subscribe]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMut({ variables: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setStatus('unsubscribed');
    } finally {
      setBusy(false);
    }
  }, [supported, unsubscribeMut]);

  // SW pediu pra navegar — handler simples (react-router gerencia)
  useEffect(() => {
    if (!supported) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.type === 'web-push-navigate' && ev.data?.url) {
        client.cache.evict({ fieldName: 'notifications' });
        window.history.pushState({}, '', ev.data.url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [supported, client]);

  return { status, busy, enable, disable, supported, publicKey };
}
