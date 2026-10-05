'use client';

import { createElement, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const modelUrl = '/models/black-hoodie.glb';
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
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const element = viewer.current;
    const wrapper = container.current;
    if (!element || !wrapper) return;

    let cancelled = false;
    const loaded = () => setStatus('ready');
    const failed = () => setStatus('error');
    element.addEventListener('load', loaded);
    element.addEventListener('error', failed);

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      // Register the browser-only custom element when the section is nearby.
      import('@google/model-viewer')
        .then(() => { if (!cancelled) setActive(true); })
        .catch(() => { if (!cancelled) failed(); });
    }, { rootMargin: '300px' });
    observer.observe(wrapper);

    return () => {
      cancelled = true;
      observer.disconnect();
      element.removeEventListener('load', loaded);
      element.removeEventListener('error', failed);
    };
  }, []);

  return (
    <div ref={container} className="graphic-model" aria-busy={status === 'loading'}>
      {createElement('model-viewer', {
        ref: viewer,
        className: 'graphic-model-viewer',
        src: active ? modelUrl : undefined,
        alt: 'Black hoodie in 3D. Drag to rotate and view it from every side.',
        'camera-controls': true,
        'disable-zoom': true,
        'disable-pan': true,
        'touch-action': 'pan-y',
        'auto-rotate': reducedMotion === false,
        'auto-rotate-delay': '1500',
        'rotation-per-second': '18deg',
        'camera-orbit': '0deg 85deg auto',
        'camera-target': 'auto auto auto',
        'field-of-view': '30deg',
        'shadow-intensity': '0.8',
        'environment-image': 'neutral',
        'interaction-prompt': 'none',
        loading: 'eager',
      }, <span slot="progress-bar" />)}
      {status !== 'ready' && (
        <div className="graphic-model-status" role="status">
          {status === 'loading' ? 'Loading hoodie…' : (
            <span>Unable to load the 3D preview. <a href={modelUrl}>Download the hoodie model</a></span>
          )}
        </div>
      )}
    </div>
  );
}
