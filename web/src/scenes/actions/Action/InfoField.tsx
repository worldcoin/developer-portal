import { KeyboardEvent, memo, MouseEvent, useCallback, useState } from "react";
import cn from "classnames";
import { Icon } from "@/components/Icon";
import { useToggle } from "@/hooks/useToggle";
import { IActionStore, useActionStore } from "src/stores/actionStore";

const getActionsStore = (store: IActionStore) => ({
  setIsOpened: store.setIsUpdateActionModalOpened,
});

export const InfoField = memo(function Input(props: {
  className?: string;
  textClassName?: string;
  placeholder?: string;
  value: string;
  onClick: () => void;
}) {
  const { setIsOpened } = useActionStore(getActionsStore);

  return (
    <div className="flex justify-start">
      <label
        onClick={(e) => e.stopPropagation()}
        className="group flex justify-start items-center h-4 gap-x-1 cursor-pointer"
      >
        <span className={cn("text-14 truncate", props.textClassName)}>
          {props.value || props.placeholder}
        </span>
        <button
          type="button"
          className="flex h-4 cursor-pointer outline-none"
          onClick={(e) => {
            e.stopPropagation();
            props.onClick();
            setIsOpened(true);
          }}
        >
          <Icon
            name={"edit"}
            className={cn(
              "h-4 w-4 text-primary-light group-hover:text-primary transition-colors"
            )}
          />
        </button>
      </label>
    </div>
  );
});
