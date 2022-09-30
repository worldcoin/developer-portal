import { ChangeEventHandler, memo } from "react";
import cn from "classnames";
import { ListFilter } from "logics/actionsLogic";

export const Toggle = memo(function Toggle(props: {
  className?: string;
  name?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  options: Array<{ value?: ListFilter["status"]; label: string }>;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-x-1 bg-ffffff border border-neutral-muted rounded-xl p-1.5 text-center">
      {props.options.map((item) => {
        const id = `actions-filter-${item.value || "null"}`;
        return (
          <span key={item.value}>
            <input
              id={id}
              className="peer hidden"
              type="radio"
              name="status"
              value={item.value}
              checked={item.value === props.value}
              onChange={props.onChange}
            />

            <label
              htmlFor={id}
              className={cn(
                "py-3 px-4 text-sora text-14 text-primary/30 -tracking-[.01em] rounded-xl cursor-pointer",
                "hover:bg-primary/10 peer-checked:text-ffffff peer-checked:bg-primary transition-colors"
              )}
            >
              {item.label}
            </label>
          </span>
        );
      })}
    </div>
  );
});
