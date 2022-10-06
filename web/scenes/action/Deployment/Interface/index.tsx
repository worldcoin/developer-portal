import { memo, ReactNode } from "react";
import cn from "classnames";
import { Icon, IconType } from "common/Icon";
import { Button } from "common/Button";
import { Switch } from "common/Switch";
import { Field } from "kea-forms";
import { UserInterfacesType } from "types";

interface InterfaceInterface {
  className?: string;
  icon: IconType;
  title: string;
  description: string;
  enabled?: boolean;
  overviewItems: Array<{
    icon: IconType;
    text: ReactNode;
  }>;
  children?: ReactNode;
  name: UserInterfacesType;
}

export const Interface = memo(function Interface(props: InterfaceInterface) {
  return (
    <div className="mb-2 bg-ffffff border border-neutral-muted rounded-xl">
      <div className="grid grid-cols-auto/1fr/auto items-center pt-8 pl-8 pr-8 pb-6">
        <div className="grid items-center justify-center w-12 h-12 mr-4 text-primary border border-primary/10 rounded-full">
          <Icon name={props.icon} className={cn("w-6 h-6")} />
        </div>
        <div className="grid grid-flow-row gap-y-1">
          <h3 className="font-sora font-semibold text-16 leading-5">
            {props.title}
          </h3>
          <p className="text-14 text-neutral leading-4">{props.description}</p>
        </div>
        <div className="grid grid-flow-col gap-x-8 items-center">
          <Button
            className="grid grid-flow-col gap-x-2 h-[34px] px-3 !font-rubik !font-medium border-primary/10 bg-primary/5"
            variant="outlined"
            color="primary"
            size="md"
          >
            Show deployment instructions
            <Icon name="arrow-right" className={cn("w-4 h-4")} />
          </Button>
          <Field noStyle name={props.name}>
            {({ value, onChange }) => (
              <Switch
                checked={value}
                onChangeChecked={(value) => onChange(value)}
              />
            )}
          </Field>
        </div>
      </div>
      {props.enabled && props.children && (
        <div className="pt-6 pl-8 pr-8 pb-8 border-t border-neutral-muted">
          {props.children}
        </div>
      )}
      <div className="pt-6 pl-8 pr-8 pb-8 border-t border-neutral-muted">
        <h3 className="grid grid-flow-col gap-x-4 mb-4 items-baseline justify-start font-sora font-semibold text-16 leading-5">
          Overview
          <span className="text-12 text-neutral-dark/30 leading-4">
            {props.title}
          </span>
        </h3>
        <div className="grid grid-flow-col justify-items-center items-center overflow-x-auto">
          {props.overviewItems.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-1fr/auto items-center w-full"
            >
              <div className="grid grid-cols-auto/1fr gap-x-2 items-center p-4 bg-f1f5f8 border border-487b8f/30 rounded-2xl">
                <Icon name={item.icon} className="w-8 h-8" noMask />
                <span className="text-14 leading-4">{item.text}</span>
              </div>
              {i < props.overviewItems.length - 1 && (
                <Icon name="arrow-right" className="w-6 h-6 mx-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
