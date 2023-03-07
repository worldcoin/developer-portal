import { memo, ReactNode } from "react";
import cn from "classnames";

interface DialogHeaderProps {
  className?: string;
  icon: ReactNode;
  title: string;
}

export const DialogHeader = memo(function DialogHeader(
  props: DialogHeaderProps
) {
  const { className, icon, title } = props;

  return (
    <div className={cn(className, "flex flex-col items-center")}>
      <div className="relative w-[72px] h-[72px]">{icon}</div>

      <h1 className="pt-6 pb-8 font-sora font-semibold text-24 leading-7">
        {title}
      </h1>
    </div>
  );
});
