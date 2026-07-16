"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { ReactNode } from "react";

type NumberedSectionProps = {
  number: string;
  title: string;
  description?: string;
  isActive?: boolean;
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
  description,
  isActive = true,
  banner,
  children,
}: NumberedSectionProps) => {
  return (
    <section
      aria-hidden={!isActive}
      className={clsx(
        "scroll-mt-2 rounded-2xl border border-grey-200 bg-grey-0 shadow-button",
        !isActive && "hidden",
      )}
    >
      <div className="flex items-start gap-x-3 border-b border-grey-100 px-6 py-5">
        <Typography
          variant={TYPOGRAPHY.M3}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-500"
        >
          {number}
        </Typography>
        <div className="grid min-w-0 gap-y-1">
          <Typography as="h2" variant={TYPOGRAPHY.M2} className="text-grey-900">
            {title}
          </Typography>
          {description && (
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              {description}
            </Typography>
          )}
        </div>
      </div>
      {banner && <div className="px-6 pt-4">{banner}</div>}
      <div className="px-6 pt-5 pb-6">{children}</div>
    </section>
  );
};
