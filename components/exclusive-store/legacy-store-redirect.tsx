'use client';
import { useEffect } from 'react';

export default function LegacyStoreRedirect() {
  useEffect(() => { window.location.replace('/exclusive-store/' + window.location.search + window.location.hash); }, []);
  return <main id="main" className="ss-page"><div className="ss-loading" role="status">Opening the exclusive store… <a href="/exclusive-store/">Continue</a></div></main>;
}
