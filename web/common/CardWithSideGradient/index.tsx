import { styles } from "common/styles";
import { memo, ReactNode } from "react";
import cn from "classnames";

export const CardWithSideGradient = memo(function CardWithSideGradient(props: {
  children: ReactNode;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div
      className={cn(
        "py-4 lg:py-8 pl-8 lg:pl-12 pr-4 lg:pr-8 font-sora relative overflow-hidden",
        props.className,
        styles.container.shadowBox
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-4 bg-gradient-to-b from-ff6848 to-primary",
          props.lineClassName
        )}
      />

      {props.children}
    </div>
  );
});
