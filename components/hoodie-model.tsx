'use client';

import { createElement, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';

// Version the URL so browsers do not reuse the previous 62 MB asset.
const modelUrl = '/models/black-hoodie.glb?v=optimized-1';
const posterUrl = '/models/black-hoodie-poster.webp';
const decoderUrl = '/models/meshopt-decoder.js';
const motionQuery = '(prefers-reduced-motion: reduce)';
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerReducedMotion = () => true;
function subscribeToReducedMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

export default function HoodieModel() {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, getServerReducedMotion);
  const [active, setActive] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const sourceUrl = attempt === 0 ? modelUrl : `${modelUrl}&retry=${attempt}`;

  useEffect(() => {
    const element = viewer.current;
    const wrapper = container.current;
    if (!element || !wrapper) return;

    let cancelled = false;
    let preload: HTMLLinkElement | undefined;
    const loaded = () => { if (!cancelled) setStatus('ready'); preload?.remove(); };
    const failed = () => { if (!cancelled) setStatus('error'); preload?.remove(); };
    element.addEventListener('load', loaded);
    element.addEventListener('error', failed);

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      // Start the model download alongside the viewer import, before it is onscreen.
      preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'fetch';
      preload.crossOrigin = 'anonymous';
      preload.href = sourceUrl;
      preload.fetchPriority = 'low';
      document.head.appendChild(preload);
      import('@google/model-viewer')
        .then(({ ModelViewerElement }) => {
          if (cancelled) return;
          // Keep compression support on our own host; no decoder CDN round trip.
          ModelViewerElement.meshoptDecoderLocation = attempt === 0 ? decoderUrl : `${decoderUrl}?retry=${attempt}`;
          setActive(true);
        })
        .catch(() => { if (!cancelled) failed(); });
    }, { rootMargin: (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ? '0px' : '800px 0px' });
    observer.observe(wrapper);

    const visibilityObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    visibilityObserver.observe(wrapper);
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      observer.disconnect();
      visibilityObserver.disconnect();
      preload?.remove();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      element.removeEventListener('load', loaded);
      element.removeEventListener('error', failed);
    };
  }, [sourceUrl, attempt]);

  return (
    <div ref={container} className="graphic-model" data-status={status} aria-busy={status === 'loading'}>
      <div className="graphic-model-poster" aria-hidden="true"><Image src={posterUrl} alt="" fill sizes="(max-width: 760px) 88vw, 44vw" loading="lazy" decoding="async" /></div>
      {createElement('model-viewer', {
        ref: viewer,
        className: 'graphic-model-viewer',
        src: active ? sourceUrl : undefined,
        alt: 'Black hoodie in 3D. Drag to rotate and view it from every side.',
        'camera-controls': true,
        'disable-zoom': true,
        'disable-pan': true,
        'touch-action': 'pan-y',
        'auto-rotate': reducedMotion === false && inView && pageVisible && status === 'ready',
        'auto-rotate-delay': '1500',
        'rotation-per-second': '18deg',
        'camera-orbit': '0deg 85deg auto',
        'camera-target': 'auto auto auto',
        'field-of-view': '30deg',
        'shadow-intensity': '0.8',
        'environment-image': 'neutral',
        'interaction-prompt': 'none',
        loading: 'eager',
        reveal: 'auto',
      }, <span slot="progress-bar" />)}
      {status !== 'ready' && (
        <div className="graphic-model-status" role="status">
          {status === 'loading' ? 'Loading hoodie…' : (
            <span>The 3D preview couldn’t load. <button type="button" onClick={() => { setActive(false); setStatus('loading'); setAttempt(value => value + 1); }}>Retry 3D preview</button></span>
          )}
        </div>
      )}
    </div>
  );
}
