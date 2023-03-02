import { memo, ReactNode } from "react";
import { Icon, IconType } from "src/common/Icon";

interface InterfaceOverviewInterface {
  className?: string;
  icon: IconType;
  title: string;
  overviewItems: Array<{
    icon: IconType;
    text: ReactNode;
  }>;
}

export const InterfaceOverview = memo(function InterfaceOverview(
  props: InterfaceOverviewInterface
) {
  return (
    <div className="pt-6 pl-8 pr-8 pb-8 border-t border-neutral-muted">
      <h3 className="grid grid-flow-col gap-x-4 mb-4 items-baseline justify-start font-sora font-semibold text-16 leading-5">
        Overview
        <span className="text-12 text-neutral-dark/30 leading-4">
          {props.title}
        </span>
      </h3>
      <div className="grid gap-y-2 grid-flow-row lg:grid-flow-col justify-items-center items-stretch overflow-x-auto">
        {props.overviewItems.map((item, i) => (
          <div
            key={i}
            className="grid gap-y-2 grid-flow-row lg:grid-cols-1fr/auto items-center w-full lg:min-w-[280px]"
          >
            <div className="grid grid-cols-auto/1fr gap-x-2 self-stretch items-center p-4 bg-f1f5f8 border border-487b8f/30 rounded-2xl">
              <Icon name={item.icon} className="w-8 h-8" noMask />
              <span className="text-14 leading-4">{item.text}</span>
            </div>
            {i < props.overviewItems.length - 1 && (
              <Icon
                name="arrow-right"
                className="w-6 h-6 mx-3 justify-self-center rotate-90 lg:rotate-0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
