import { Radio, RadioProps } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const RadioCard = (
  props: Omit<RadioProps, "value"> & {
    className?: string;
    option: { value: string; label: string };
    description?: string;
    stampText?: string;
  }
) => {
  return (
    <label
      className={twMerge(
        clsx(
          "px-6 py-5 border border-grey-100 hover:border-blue-500 transition-colors rounded-lg grid gap-y-3 cursor-pointer",
          props.className
        )
      )}
    >
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-auto/1fr items-center gap-x-2">
          <Radio register={props.register} value={props.option.value} />

          <Typography variant={TYPOGRAPHY.M3} className="select-none">
            {props.option.label}
          </Typography>
        </div>

        {props.stampText && (
          <Typography
            as="div"
            variant={TYPOGRAPHY.M5}
            className="text-blue-500 bg-blue-100 rounded-full py-0.5 px-2"
          >
            {props.stampText}
          </Typography>
        )}
      </div>

      {props.description && (
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {props.description}
        </Typography>
      )}
    </label>
  );
};
