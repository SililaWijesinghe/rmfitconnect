import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const startVal = from.current;
    const delta = value - startVal;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + delta * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      from.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{Math.round(display).toLocaleString()}</span>;
}
