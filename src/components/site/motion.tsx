import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/** Fades + lifts content in as it scrolls into view. Content stays visible without JS. */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "in";
        io.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={className} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Fixed glass-ribbon backdrop that drifts and parallaxes with scroll, plus a scroll progress line. */
export function Ribbons() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty("--scroll", String(window.scrollY));
      root.style.setProperty("--progress", String(Math.min(1, window.scrollY / max)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="ribbons" aria-hidden="true">
        <svg className="ribbon ribbon-l" viewBox="0 0 600 900" preserveAspectRatio="xMinYMid slice">
          <defs>
            <linearGradient id="rg-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
              <stop offset="0.5" stopColor="#9aa3b2" stopOpacity="0.05" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rg-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.45" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-40 60C180 90 360 260 430 520S520 860 640 900L-40 900Z" fill="url(#rg-fill)" />
          <path d="M-40 140C150 150 320 300 380 540S470 840 560 900" fill="none" stroke="url(#rg-edge)" strokeWidth="1.2" />
          <path d="M-40 230C120 230 260 340 320 560S410 850 480 900" fill="none" stroke="url(#rg-edge)" strokeWidth="0.7" opacity="0.6" />
        </svg>
        <svg className="ribbon ribbon-r" viewBox="0 0 600 900" preserveAspectRatio="xMaxYMid slice">
          <path d="M640 40C420 120 260 330 220 560S140 830 40 900L640 900Z" fill="url(#rg-fill)" />
          <path d="M640 120C440 190 300 360 270 570S190 830 110 900" fill="none" stroke="url(#rg-edge)" strokeWidth="1.2" />
          <path d="M640 210C470 270 350 410 320 590S250 850 190 900" fill="none" stroke="url(#rg-edge)" strokeWidth="0.7" opacity="0.6" />
        </svg>
      </div>
    </>
  );
}
