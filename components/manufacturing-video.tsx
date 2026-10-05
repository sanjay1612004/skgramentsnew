'use client';

import { useEffect, useRef } from 'react';

export default function ManufacturingVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let inView = false;
    let disposed = false;
    video.muted = true;

    const syncPlayback = () => {
      if (inView && !document.hidden && !disposed) {
        void video.play().then(() => {
          // Scrolling away can happen while the browser starts playback.
          if (!inView || document.hidden || disposed) video.pause();
        }).catch(() => {
          // Keep the poster visible if the browser blocks autoplay.
        });
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncPlayback();
    }, { threshold: [0, 0.25] });

    observer.observe(video);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, []);

  return (
    <section className="manufacturing-video" id="manufacturing" aria-label="Garment manufacturing and dispatch">
      <div className="section-kicker">
        <span>08 / IN THE MAKING</span>
        <span>MANUFACTURING &amp; DISPATCH</span>
      </div>
      <video
        ref={videoRef}
        className="manufacturing-player"
        muted
        loop
        playsInline
        controls={false}
        preload="metadata"
        poster="/videos/garment-manufacturing-poster.jpg"
        aria-label="Garment manufacturing and dispatch"
        aria-describedby="manufacturing-caption"
      >
        <source src="/videos/garment-manufacturing-dispatch.mp4" type="video/mp4" />
        Your browser does not support video playback. <a href="/videos/garment-manufacturing-dispatch.mp4">Watch the manufacturing video</a>.
      </video>
      <div className="manufacturing-caption" id="manufacturing-caption">
        <p>From first cut to final dispatch.</p>
        <span>SK GARMENTS <span aria-hidden="true">✳</span></span>
      </div>
    </section>
  );
}
