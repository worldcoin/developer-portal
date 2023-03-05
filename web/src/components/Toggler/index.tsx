import { render } from "@headlessui/react/dist/utils/render";
import classNames from "classnames";
import { Dispatch, ReactElement, SetStateAction } from "react";

export function Toggler<T extends any>(props: {
  value: T;
  values: Array<T>;
  setValue: Dispatch<SetStateAction<T>>;
  render: (item: T) => ReactElement;
}) {
  return (
    <div className="grid grid-cols-2 text-center w-max text-14 leading-5">
      {props.values.map((item, key) => (
        <span
          key={key}
          className={classNames(
            "transition-all py-2.5 px-6 cursor-pointer first:rounded-l-xl last:rounded-r-xl select-none",
            {
              "text-ffffff bg-neutral-primary hover:opacity-75":
                props.value === item,
              "text-neutral-primary bg-f3f4f5 hover:bg-neutral-primary/25":
                props.value !== item,
            }
          )}
          onClick={() => props.setValue(item)}
        >
          {props.render(item)}
        </span>
      ))}
    </div>
  );
}
