import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type ToggleSectionProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export const ToggleSection = (props: ToggleSectionProps) => {
  const { title, description, checked, onChange, className } = props;

  return (
    <div
      className={clsx(
        "grid grid-cols-auto/1fr/auto items-center gap-x-4 rounded-lg border-[1px] border-grey-200 bg-grey-0 px-2 py-4 transition-colors hover:border-grey-700",
        className,
      )}
    >
      <div className="grid gap-y-1 pl-2">
        <Typography variant={TYPOGRAPHY.R3} className="font-semibold">
          {title}
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {description}
        </Typography>
      </div>
      <div className="flex items-center justify-end">
        <Toggle
          checked={checked}
          onChange={onChange}
          className="focus:!ring-grey-900 aria-checked:!bg-grey-900"
        />
      </div>
    </div>
  );
};
