import { memo } from "react";
import cn from "classnames";
import { Listbox } from "@headlessui/react";
import { Icon } from "src/components/Icon";
import { ActionModel } from "src/lib/models";

type _Action = Pick<ActionModel, "id" | "name">;
interface ActionSelectProps {
  value?: _Action;
  onChange: (value: _Action) => void;
  options?: _Action[];
}

export const ActionSelect = memo(function ActionSelect(
  props: ActionSelectProps
) {
  const { value, onChange, options } = props;

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            className={cn(
              "flex items-center justify-between h-12 w-[336px] px-4 font-rubik text-14 text-left bg-f3f4f5 rounded-xl"
            )}
          >
            <span>{value?.name ?? ""}</span>
            <Icon
              name="angle-down"
              className={cn("w-4 h-4 transition-transform", {
                "rotate-180": open,
              })}
            />
          </Listbox.Button>

          <Listbox.Options className="absolute bottom-[110%] z-10 -mt-2 w-full py-2 bg-f3f4f5 rounded-xl">
            {options?.map((option) => (
              <Listbox.Option
                key={option.id}
                className="px-4 py-2 font-rubik text-14 cursor-pointer hover:bg-ebecef"
                value={option}
              >
                {option.name}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      )}
    </Listbox>
  );
});
