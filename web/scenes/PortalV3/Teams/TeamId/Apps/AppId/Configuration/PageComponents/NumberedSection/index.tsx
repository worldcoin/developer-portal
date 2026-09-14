"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { ReactNode } from "react";

type NumberedSectionProps = {
  /**
   * The step this section renders — sourced from getAppStoreWizardSteps so the
   * wizard header and the section header can never drift.
   */
  step: { number: string; title: string; description?: string };
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
  step: { number, title, description },
  isActive = true,
  banner,
  children,
}: NumberedSectionProps) => {
  return (
    <section
      aria-hidden={!isActive}
      className={clsx(
        "scroll-mt-2 rounded-2xl border border-edge bg-surface shadow-button",
        !isActive && "hidden",
      )}
    >
      <div className="flex items-start gap-x-3 border-b border-edge-subtle px-6 py-5">
        <Typography
          variant={TYPOGRAPHY.M3}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-info-soft text-content-link-legacy"
        >
          {number}
        </Typography>
        <div className="grid min-w-0 gap-y-1">
          <Typography
            as="h2"
            variant={TYPOGRAPHY.M2}
            className="text-content-primary"
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant={TYPOGRAPHY.R4}
              className="text-content-secondary"
            >
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
