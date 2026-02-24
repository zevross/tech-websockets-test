import { useEffect, useRef, useState } from "react";

export const useResize = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    if (!containerRef.current) {
      return;
    }
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
};
