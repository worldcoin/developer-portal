import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { OpUnitType } from "dayjs";
import { WritableAtom, useAtom } from "jotai";

export type Timespan = {
  label: string;
  value: OpUnitType;
};

export const TimespanSelector = <T extends Timespan>(props: {
  options: Array<T>;
  atom: WritableAtom<T, [T], void>;
}) => {
  const [value, setValue] = useAtom(props.atom);

  return (
    <Select value={value} onChange={setValue}>
      <SelectButton className="border border-grey-200 rounded-lg px-4 py-2 min-w-[150px]">
        {({ value }) => (
          <div className="grid grid-cols-1fr/auto gap-x-2 items-center">
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-grey-700 text-start"
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
