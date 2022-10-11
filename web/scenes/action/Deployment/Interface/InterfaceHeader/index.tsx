import { memo, ReactNode } from "react";
import cn from "classnames";
import { Icon, IconType } from "common/Icon";

interface InterfaceHeaderInterface {
  className?: string;
  icon: IconType;
  title: string;
  description: string;
  children?: ReactNode;
}

export const InterfaceHeader = memo(function InterfaceHeader(
  props: InterfaceHeaderInterface
) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-8 pl-8 pr-8 pb-6">
      <div className="grid items-center justify-center w-12 h-12 mr-4 text-primary border border-primary/10 rounded-full">
        <Icon name={props.icon} className={cn("w-6 h-6")} />
      </div>
      <div className="grid grid-flow-row gap-y-1">
        <h3 className="font-sora font-semibold text-16 leading-5">
          {props.title}
        </h3>
        <p className="text-14 text-neutral leading-4">{props.description}</p>
      </div>
      <div className="grow grid grid-flow-col gap-x-8 items-center justify-end">
        {props.children}
      </div>
    </div>
  );
});
