import cn from "classnames";
import { Icon, IconType } from "src/components/Icon";
import { Button } from "src/components/LegacyButton";
import { memo, ReactNode } from "react";
import { CreateActionFormValues } from "../types";

export const CheckboxCard = memo(function CheckboxCard(props: {
  icon: IconType;
  title: string;
  name: string;
  value: CreateActionFormValues["engine"];
  description: string;
  list: Array<ReactNode>;
  stamp?: string;
  onChange: (value: CreateActionFormValues["engine"]) => void;
  currentValue: CreateActionFormValues["engine"];
}) {
  return (
    <div
      className={cn(
        "p-10 grid gap-y-6 relative cursor-pointer bg-ffffff rounded-xl border border-neutral-muted"
      )}
      onClick={() => props.onChange(props.value)}
    >
      {props.stamp && (
        <div className="text-14 border border-primary rounded-full px-4 py-2 absolute top-5 right-5 bg-neutral-muted/40 text-primary">
          {props.stamp}
        </div>
      )}

      <div className="grid grid-cols-auto/1fr gap-x-3 items-center">
        <div className="w-16 h-16 flex justify-center items-center rounded-full border border-neutral-muted text-0 leading-none">
          <Icon name={props.icon} className="w-6 h-6 text-primary" />
        </div>

        <div>
          <span className="text-20 text-neutral-dark font-medium">
            {props.title}
          </span>
          <p className="text-14 text-626467">{props.description}</p>
        </div>
      </div>

      <ul className="list-disc">
        {props.list.map((item, index) => (
          <li
            key={`checkbox-card-list-item-${index}`}
            className="text-neutral-dark leading-5 text-14"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="grid items-end mt-4">
        <Button
          type="button"
          className="space-x-2.5"
          color={props.currentValue === props.value ? "success" : "primary"}
          variant={
            props.currentValue === props.value ? "contained" : "outlined"
          }
          fullWidth
        >
          {props.currentValue === props.value && (
            <Icon name="check" className="w-5 h-5" />
          )}
          <span className="uppercase font-sora leading-normal">
            {props.currentValue === props.value ? "selected" : "select"}
          </span>
        </Button>
      </div>
    </div>
  );
});
