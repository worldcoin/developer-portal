"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { RefObject, useEffect, useState } from "react";
import { sectionsAtom } from "../NumberedSection";

type SectionTocProps = {
  // The form column that scrolls internally on lg+ — used as the observer
  // root so the highlight tracks that container's scroll, not the window's.
  scrollContainerRef: RefObject<HTMLElement | null>;
};

/**
 * Jump nav for the numbered sections: mirrors the section headers' numbered
 * badges (the active one lights up in the same blue), under an uppercase
 * label matching the rail's "Live preview" — the two rails flanking the form
 * read as one system. The section list comes from the registry the sections
 * maintain themselves.
 */
export const SectionToc = ({ scrollContainerRef }: SectionTocProps) => {
  const sections = useAtomValue(sectionsAtom);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // jsdom has no IntersectionObserver; the toc still renders, just without
    // scroll tracking.
    if (typeof IntersectionObserver === "undefined") return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    // Active = the first registered section intersecting the top 40% band of
    // the scroll container.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = sections.find((s) => visible.has(s.id));
        if (first) setActiveId(first.id);
      },
      { root: scrollContainerRef.current, rootMargin: "0px 0px -60% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, scrollContainerRef]);

  if (sections.length === 0) return null;

  const currentId = activeId ?? sections[0]?.id;

  return (
    <nav aria-label="Page sections" className="grid content-start gap-y-1">
      <Typography
        variant={TYPOGRAPHY.R5}
        className="pb-2 pl-2 uppercase tracking-[0.2em] text-grey-400"
      >
        Sections
      </Typography>

      {sections.map((section) => {
        const isActive = section.id === currentId;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() =>
              document
                .getElementById(section.id)
                ?.scrollIntoView?.({ behavior: "smooth", block: "start" })
            }
            className={clsx(
              "group flex items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
              isActive ? "bg-grey-50" : "hover:bg-grey-25",
            )}
          >
            <span
              className={clsx(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-500"
                  : "bg-grey-100 text-grey-400 group-hover:text-grey-500",
              )}
            >
              {section.number}
            </span>
            <Typography
              variant={TYPOGRAPHY.R4}
              className={clsx(
                "min-w-0 transition-colors",
                isActive
                  ? "text-grey-900"
                  : "text-grey-500 group-hover:text-grey-700",
              )}
            >
              {section.title}
            </Typography>
          </button>
        );
      })}
    </nav>
  );
};
