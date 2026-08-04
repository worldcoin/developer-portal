import { ReactNode } from "react";

/**
 * Section title + supporting copy used by the wizard's later steps
 * (e.g. "Supported Countries" / "Supported Languages" on Availability).
 */
export const SectionHeader = (props: {
  title: string;
  required?: boolean;
  description?: ReactNode;
}) => (
  <header className="flex w-full flex-col gap-3">
    <h2 className="text-15 leading-[1.2] font-medium text-portal-ink">
      {props.title}
      {props.required && <span className="text-danger"> *</span>}
    </h2>
    {props.description && (
      // Figma nucleus/foreground-secondary (#7d7d7d) — no portal token yet.
      <p className="w-full text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
        {props.description}
      </p>
    )}
  </header>
);
