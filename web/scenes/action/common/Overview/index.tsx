import cn from "classnames";
import { Fragment, memo, ReactNode } from "react";
import { Icon, IconType } from "common/Icon";

export const Overview = memo(function Overview(props: {
  className?: string;
  items: Array<{
    icon: IconType;
    text: ReactNode;
  }>;
}) {
  return (
    <div
      className={cn(
        "grid overflow-x-auto grid-flow-col justify-items-center gap-y-6 items-center justify-between gap-x-12",
        props.className
      )}
    >
      {props.items.map((item, i) => (
        <Fragment key={i}>
          <Fragment>
            <Icon className="w-24 h-24 row-start-1" name={item.icon} noMask />
            <div className="row-start-2 text-center text-16 text-neutral">
              {item.text}
            </div>
          </Fragment>
          {i < props.items.length - 1 && (
            <Icon
              name="arrow-right"
              className="w-6 h-6 row-start-2 text-primary"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
});
