import { Icon } from "common/Icon";
import { memo, ReactNode } from "react";
import cn from "classnames";

export const PreTag = memo(function PreTag(props: {
  children: ReactNode;
  theme: "error" | "neutral" | "success";
  loading?: boolean;
}) {
  return (
    <pre
      className={cn(
        "grid border rounded-lg relative items-center transition-colors overflow-x-auto",
        { "py-16": props.loading },
        { "bg-neutral-muted/20 border-primary": props.theme === "neutral" },
        { "bg-warning/5 border-warning": props.theme === "error" },
        { "bg-success/5 border-success": props.theme === "success" }
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
