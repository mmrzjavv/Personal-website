"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

// Lenis feels great on desktop wheel, but on phones it often fights native
 // touch scrolling and can make the page feel stuck. Use native scroll there.
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [enableLenis, setEnableLenis] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wide = window.matchMedia("(min-width: 768px)");
    const sync = () => setEnableLenis(finePointer.matches && wide.matches);
    sync();
    finePointer.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      finePointer.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  if (!enableLenis) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.15,
      }}
    >
      {children}
    </ReactLenis>
  );
}
