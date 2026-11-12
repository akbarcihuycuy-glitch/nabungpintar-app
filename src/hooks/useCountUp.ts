import { useState, useEffect, useRef } from 'react';

/**
 * Hook for smooth 400ms count-up numeric animation (PRD Section 1.3)
 */
export function useCountUp(target: number, duration: number = 400): number {
  const [current, setCurrent] = useState<number>(target);
  const prevRef = useRef<number>(target);

  useEffect(() => {
    const startValue = prevRef.current;
    const endValue = target;
    if (startValue === endValue) return;

    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startValue + (endValue - startValue) * ease);
      setCurrent(nextVal);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        prevRef.current = endValue;
        setCurrent(endValue);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return current;
}
