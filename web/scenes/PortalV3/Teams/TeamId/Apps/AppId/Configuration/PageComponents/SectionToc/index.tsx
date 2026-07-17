"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { urls } from "@/lib/urls";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { RefObject, useEffect, useState } from "react";
import { sectionsAtom } from "../NumberedSection";

type SectionTocProps = {
  appId: string;
  teamId: string;
  // The form column that scrolls internally on lg+ — used as the observer
  // root so the highlight tracks that container's scroll, not the window's.
  scrollContainerRef: RefObject<HTMLElement | null>;
};

/**
 * Jump nav for the numbered sections: mirrors the section headers' numbered
 * badges (the active one lights up in the same blue). The section list comes
 * from the registry the sections maintain themselves.
 */
export const SectionToc = ({
  appId,
  teamId,
  scrollContainerRef,
}: SectionTocProps) => {
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
    <nav
      aria-label="Page sections"
      className="flex content-start justify-end lg:grid lg:gap-y-1"
    >
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
              "group hidden items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-left transition-colors lg:flex",
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

      <div className="lg:mt-4 lg:border-t lg:border-grey-200 lg:pt-4">
        <Link
          href={urls.configurationDanger({
            team_id: teamId,
            app_id: appId,
          })}
          className="group flex items-center gap-x-2.5 rounded-full border border-grey-200 bg-grey-0 px-3 py-2 text-grey-500 shadow-xs transition-colors hover:border-system-error-200 hover:bg-system-error-50 hover:text-system-error-600 lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2 lg:shadow-none"
        >
          <span className="grid size-6 shrink-0 place-items-center">
            <TrashIcon className="size-4" />
          </span>
          <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
        </Link>
      </div>
    </nav>
  );
};
