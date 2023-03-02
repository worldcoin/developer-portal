import { Icon } from "src/common/Icon";
import { memo, ReactNode } from "react";
import cn from "classnames";

export const PreTag = memo(function PreTag(props: {
  className?: string;
  children: ReactNode;
  theme: "error" | "neutral" | "success";
  loading?: boolean;
}) {
  return (
    <pre
      className={cn(
        "grid relative items-center p-4 transition-colors overflow-x-auto",
        "bg-neutral-muted/30 border border-neutral-muted rounded-lg",
        { "py-16": props.loading },
        { "bg-neutral-muted/20 border-primary": props.theme === "neutral" },
        { "bg-danger/5 border-danger": props.theme === "error" },
        { "bg-success/5 border-success": props.theme === "success" },
        props.className
      )}
    >
      {!props.loading && props.children}

      {props.loading && (
        <div className="grid justify-center">
          <div className="grid gap-x-2 grid-cols-auto/1fr items-center">
            <Icon name="spinner" className="h-8 w-8 animate-spin" noMask />
            <span className="font-medium">Awaiting request</span>
          </div>
        </div>
      )}
    </pre>
  );
});
