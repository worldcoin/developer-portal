"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useSetAtom } from "jotai";
import { ReactNode, useEffect } from "react";

export type RegisteredSection = {
  number: string;
  title: string;
  id: string;
};

// Sections register themselves on mount so the jump nav (SectionToc) derives
// its list from what's actually rendered — external mode drops Store listing
// and renumbers the rest, and the registry follows automatically.
export const sectionsAtom = atom<RegisteredSection[]>([]);

const sectionAnchorId = (title: string) =>
  `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

type NumberedSectionProps = {
  number: string;
  title: string;
  // Rendered between the header and the body (e.g. the Availability
  // laws/regulations warning).
  banner?: ReactNode;
  children: ReactNode;
};

/**
 * Numbered section card for the Configuration page: `NN · Title` header with
 * the body always exposed inside the border.
 */
export const NumberedSection = ({
  number,
  title,
  banner,
  children,
}: NumberedSectionProps) => {
  const setSections = useSetAtom(sectionsAtom);
  const id = sectionAnchorId(title);

  useEffect(() => {
    setSections((prev) =>
      [...prev.filter((s) => s.id !== id), { number, title, id }].sort((a, b) =>
        a.number.localeCompare(b.number),
      ),
    );
    return () => setSections((prev) => prev.filter((s) => s.id !== id));
  }, [id, number, title, setSections]);

  return (
    <section
      id={id}
      className="scroll-mt-2 rounded-2xl border border-grey-200 bg-grey-0 shadow-button"
    >
      <div className="flex items-center gap-x-3 border-b border-grey-100 px-6 py-4">
        <Typography
          variant={TYPOGRAPHY.M3}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-500"
        >
          {number}
        </Typography>
        <Typography as="h2" variant={TYPOGRAPHY.M2} className="text-grey-900">
          {title}
        </Typography>
      </div>
      {banner && <div className="px-6 pt-4">{banner}</div>}
      <div className="px-6 pb-6 pt-5">{children}</div>
    </section>
  );
};
