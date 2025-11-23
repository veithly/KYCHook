import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface ParallaxSectionProps {
  background?: ReactNode;
  intensity?: number;
  className?: string;
  children: ReactNode;
}

export function ParallaxSection({
  background,
  intensity = 0.2,
  className = "",
  children,
}: ParallaxSectionProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!layerRef.current) return;
      const rect = layerRef.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setOffset(-center * intensity);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [intensity]);

  return (
    <div className={`parallax-section ${className}`.trim()}>
      {background ? (
        <div
          ref={layerRef}
          className="parallax-layer"
          style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        >
          {background}
        </div>
      ) : null}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
