import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateOverviewResponse } from "@/lib/types";
import { useAtom, WritableAtom } from "jotai";

// TODO: extract to separate component to reduce code duplication
export const TimespanSelector = <
  T extends {
    label: string;
    value: AffiliateOverviewResponse["result"]["period"];
  },
>(props: {
  options: Array<T>;
  atom: WritableAtom<T, [T], void>;
}) => {
  const [value, setValue] = useAtom(props.atom);

  return (
    <Select value={value} onChange={setValue}>
      <SelectButton className="min-w-[150px] rounded-lg border border-grey-200 px-4 py-2 md:w-fit">
        {({ value }) => (
          <div className="grid grid-cols-1fr/auto items-center gap-x-2">
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-start text-grey-700"
            >
              {value.label}
            </Typography>
            <CaretIcon />
          </div>
        )}
      </SelectButton>

      <SelectOptions>
        {props.options.map((option, index) => (
          <SelectOption
            key={`stats-timespan-option-${option.value}-${index}`}
            value={option}
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectOptions>
    </Select>
  );
};
