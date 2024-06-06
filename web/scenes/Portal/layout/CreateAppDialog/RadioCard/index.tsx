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
    testId?: string;
  },
) => {
  return (
    <label
      className={twMerge(
        clsx(
          "grid cursor-pointer gap-y-3 rounded-lg border border-grey-100 px-6 py-5 transition-colors hover:border-blue-500",
          props.className,
        ),
      )}
      {...(props.testId ? { "data-testid": `card-${props.testId}` } : {})}
    >
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-auto/1fr items-center gap-x-2">
          <Radio
            register={props.register}
            value={props.option.value}
            {...(props.testId ? { "data-testid": `radio-${props.testId}` } : {})}
          />

          <Typography variant={TYPOGRAPHY.M3} className="select-none">
            {props.option.label}
          </Typography>
        </div>

        {props.stampText && (
          <Typography
            as="div"
            variant={TYPOGRAPHY.M5}
            className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-500"
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
