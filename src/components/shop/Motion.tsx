"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveals sections' parts once as they enter, and opens product photographs from
 * their frame. Marks <html> with .js first, so without script nothing is hidden.
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    const watch = () => document.querySelectorAll("[data-reveal]:not(.is-in), [data-shutter]:not(.is-in)").forEach((el) => io.observe(el));
    watch();
    // Client-rendered parts (search results, the cart) arrive after this runs.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);
  return null;
}
