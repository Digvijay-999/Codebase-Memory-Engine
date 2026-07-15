import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useInView } from 'framer-motion';

// Lazy load the Spline component to avoid blocking the main thread
const LazySpline = lazy(() => import('@splinetool/react-spline'));

const SPLINE_SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

function Skeleton() {
  return (
    <div className="w-full h-full bg-surface animate-pulse rounded-2xl flex items-center justify-center border border-border">
      <span className="text-text-muted text-sm font-mono">Loading model...</span>
    </div>
  );
}

function StaticFallback() {
  return (
    <div className="w-full h-full bg-surface rounded-2xl flex flex-col items-center justify-center border border-border relative overflow-hidden">
      {/* Wireframe placeholder */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] [background-size:24px_24px]"></div>
      <div className="w-32 h-32 border border-text-muted rounded-full flex items-center justify-center">
        <div className="w-24 h-24 border border-border rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-text-muted rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function SplineRobot({ className }) {
  const reducedMotion = useReducedMotion();
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const splineAppRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "200px" });

  useEffect(() => {
    if (splineAppRef.current) {
      if (isInView) {
        splineAppRef.current.play();
      } else {
        splineAppRef.current.stop();
      }
    }
  }, [isInView]);

  // If user prefers reduced motion or spline fails, show static wireframe
  if (reducedMotion || hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <StaticFallback />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Subtle radial vignette behind spline */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none"></div>
      
      <Suspense fallback={<Skeleton />}>
        <LazySpline 
          scene={SPLINE_SCENE_URL} 
          onLoad={(app) => { splineAppRef.current = app; }}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
}
