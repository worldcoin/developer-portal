import { memo, ReactNode } from "react";
import cn from "classnames";

interface HeaderTextInterface {
  className?: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}

export const HeaderText = memo(function HeaderText(props: HeaderTextInterface) {
  return (
    <div
      className={cn(
        "relative my-6 pl-4 before:absolute before:top-0 before:left-0 before:w-0.5 before:h-full",
        "before:bg-000000 before:bg-gradient-to-t from-ff6848 to-primary before:rounded",
        props.className
      )}
    >
      <div className="font-sora font-semibold text-16 leading-5">
        {props.title}
      </div>

      <div className="mt-1 text-14 text-neutral leading-4">
        {props.description}
      </div>
      {props.children ?? null}
    </div>
  );
});
