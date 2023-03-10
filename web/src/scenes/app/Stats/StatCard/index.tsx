import { memo } from "react";
import { Icon, IconType } from "src/components/Icon";

export const StatCard = memo(function StatCard(props: {
  title: string;
  value: string | number;
  icon: IconType;
  className?: string;
}) {
  return (
    <div className="bg-f3f4f5 rounded-2xl grid grid-cols-auto/1fr justify-items-start items-center gap-x-8 p-8 min-w-[240px]">
      <Icon name={props.icon} className="w-6 h-6 text-primary" />

      <div className="grid gap-y-0.5">
        <span className="text-14 font-medium">{props.value}</span>
        <span>{props.title}</span>
      </div>
    </div>
  );
});
