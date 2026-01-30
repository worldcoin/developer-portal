"use client";

import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type MiniappToggleSectionProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export const MiniappToggleSection = (props: MiniappToggleSectionProps) => {
  const { checked, onChange, className } = props;

  return (
    <div
      className={clsx(
        "grid grid-cols-auto/1fr/auto items-center gap-x-4 rounded-lg border-[1px] border-grey-200 bg-grey-0 px-2 py-4 transition-colors hover:border-grey-700 focus-within:border-blue-500 focus-within:hover:border-blue-500",
        className,
      )}
    >
      <div className="grid gap-y-1 pl-2">
        <Typography variant={TYPOGRAPHY.R3} className="font-semibold">
          Mini App
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Enable App to run as Mini App
        </Typography>
      </div>
      <div className="flex items-center justify-end">
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
};
