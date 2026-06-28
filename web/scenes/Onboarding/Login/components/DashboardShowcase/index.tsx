"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

const SHOWCASE_SLIDES = [
  {
    caption: "Create and manage every app from one console.",
    label: "Apps",
  },
  {
    caption: "Configure proof actions and verification levels.",
    label: "Actions",
  },
  {
    caption: "Track verifications and monitor proof volume.",
    label: "Insights",
  },
] as const;

const BrowserChrome = () => (
  <div className="flex items-center gap-3 border-b border-grey-200 bg-grey-0 px-4 py-3 md:px-5">
    <div className="flex gap-1.5">
      <span className="size-2.5 rounded-full bg-grey-200 md:size-3" />
      <span className="size-2.5 rounded-full bg-grey-200 md:size-3" />
      <span className="size-2.5 rounded-full bg-grey-200 md:size-3" />
    </div>

    <div className="mx-auto flex h-7 min-w-0 max-w-md flex-1 items-center rounded-full bg-grey-50 px-4 font-gta text-xs text-grey-400">
      developer.world.org
    </div>
  </div>
);

const AppsSlide = () => (
  <div className="grid h-full grid-cols-[88px_1fr] gap-0 bg-grey-0">
    <div className="border-r border-grey-100 bg-grey-50 p-3">
      <div className="mb-4 h-2 w-10 rounded-full bg-grey-200" />
      <div className="grid gap-2">
        <div className="h-7 rounded-8 bg-grey-900/10" />
        <div className="h-7 rounded-8 bg-grey-100" />
        <div className="h-7 rounded-8 bg-grey-100" />
      </div>
    </div>

    <div className="grid gap-4 p-4 md:p-5">
      <div className="h-4 w-32 rounded-full bg-grey-900/15" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50 p-4"
            key={item}
          >
            <div className="size-10 rounded-12 bg-blue-100" />
            <div className="grid gap-2">
              <div className="h-2.5 w-24 rounded-full bg-grey-900/15" />
              <div className="h-2 w-full rounded-full bg-grey-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActionsSlide = () => (
  <div className="grid h-full grid-cols-[88px_1fr] gap-0 bg-grey-0">
    <div className="border-r border-grey-100 bg-grey-50 p-3">
      <div className="mb-4 h-2 w-10 rounded-full bg-grey-200" />
      <div className="grid gap-2">
        <div className="h-7 rounded-8 bg-grey-100" />
        <div className="h-7 rounded-8 bg-grey-900/10" />
        <div className="h-7 rounded-8 bg-grey-100" />
      </div>
    </div>

    <div className="grid gap-4 p-4 md:p-5">
      <div className="h-4 w-40 rounded-full bg-grey-900/15" />
      {[0, 1, 2].map((item) => (
        <div
          className="grid gap-3 rounded-16 border border-grey-100 bg-grey-50 p-4"
          key={item}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 w-28 rounded-full bg-grey-900/15" />
            <div className="h-6 w-11 rounded-full bg-blue-500/20" />
          </div>
          <div className="grid gap-2">
            <div className="h-2 w-full rounded-full bg-grey-200" />
            <div className="h-2 w-4/5 rounded-full bg-grey-200" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const InsightsSlide = () => (
  <div className="grid h-full grid-cols-[88px_1fr] gap-0 bg-grey-0">
    <div className="border-r border-grey-100 bg-grey-50 p-3">
      <div className="mb-4 h-2 w-10 rounded-full bg-grey-200" />
      <div className="grid gap-2">
        <div className="h-7 rounded-8 bg-grey-100" />
        <div className="h-7 rounded-8 bg-grey-100" />
        <div className="h-7 rounded-8 bg-grey-900/10" />
      </div>
    </div>

    <div className="grid gap-4 p-4 md:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            className="grid gap-2 rounded-16 border border-grey-100 bg-grey-50 p-4"
            key={item}
          >
            <div className="h-2 w-16 rounded-full bg-grey-400" />
            <div className="h-6 w-20 rounded-full bg-grey-900/15" />
          </div>
        ))}
      </div>

      <div className="grid flex-1 content-end gap-3 rounded-16 border border-grey-100 bg-grey-50 p-4">
        <div className="flex h-28 items-end gap-2 md:h-32">
          {[38, 62, 48, 84, 56, 72, 44].map((height, item) => (
            <div
              className="flex-1 rounded-t-8 bg-blue-500/25"
              key={item}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SLIDE_VIEWS = [AppsSlide, ActionsSlide, InsightsSlide] as const;

export const DashboardShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(media.matches);

    syncMotion();
    media.addEventListener("change", syncMotion);

    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-10% 0px", threshold: 0.15 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !isVisible) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SHOWCASE_SLIDES.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isVisible, reduceMotion]);

  return (
    <section
      className="bg-white px-6 py-16 text-grey-900 md:py-24 lg:px-10"
      ref={sectionRef}
    >
      <div
        className={clsx(
          "mx-auto max-w-[1280px] transition-all duration-700 ease-out motion-reduce:transition-none",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        )}
      >
        <div className="max-w-[740px]">
          <h2 className="font-twk text-[40px] font-medium leading-[0.98] tracking-[0] text-grey-900 sm:text-[48px] md:text-[68px] lg:text-[78px]">
            Verify your users are human
          </h2>

          <p className="mt-5 max-w-[560px] font-gta text-[18px] leading-[1.35] text-grey-400 md:text-[20px]">
            {SHOWCASE_SLIDES[activeSlide].caption}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-grey-200 bg-grey-50 shadow-[0_28px_90px_rgba(0,0,0,0.08)] md:mt-14">
          <BrowserChrome />

          <div className="relative aspect-[16/10] bg-grey-0">
            {SLIDE_VIEWS.map((SlideView, index) => (
              <div
                className={clsx(
                  "absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none",
                  activeSlide === index
                    ? "opacity-100"
                    : "pointer-events-none opacity-0",
                )}
                key={SHOWCASE_SLIDES[index].label}
              >
                <SlideView />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {SHOWCASE_SLIDES.map((slide, index) => (
            <button
              aria-current={activeSlide === index}
              aria-label={`Show ${slide.label} view`}
              className={clsx(
                "rounded-full px-4 py-2 font-gta text-sm transition-colors duration-300",
                activeSlide === index
                  ? "bg-grey-900 text-white"
                  : "bg-grey-100 text-grey-500 hover:text-grey-900",
              )}
              key={slide.label}
              onClick={() => setActiveSlide(index)}
              type="button"
            >
              {slide.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
