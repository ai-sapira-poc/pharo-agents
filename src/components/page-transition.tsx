"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const [opacity, setOpacity] = useState(1);
  const prevKey = useRef(key);

  useEffect(() => {
    if (prevKey.current !== key) {
      setOpacity(0);
      const t = setTimeout(() => setOpacity(1), 50);
      prevKey.current = key;
      return () => clearTimeout(t);
    }
  }, [key]);

  return (
    <div style={{ opacity, transition: "opacity 150ms ease-in-out" }}>
      {children}
    </div>
  );
}
