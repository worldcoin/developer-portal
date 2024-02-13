import clsx from "clsx";
import { memo, ReactNode } from "react";

export const PreTag = memo(function PreTag(props: {
  className?: string;
  children: ReactNode;
  theme: "error" | "neutral" | "success";
  loading?: boolean;
}) {
  return (
    <pre
      className={clsx(
        "relative grid items-center overflow-x-auto p-4 transition-colors",
        "rounded-lg border border-[#f0edf9] bg-[#f0edf9]/30",
        { "py-16": props.loading },
        { "border-primary bg-[#f0edf9]/20": props.theme === "neutral" },
        { "border-danger bg-system-error-700/5": props.theme === "error" },
        { "border-success bg-system-success-700/5": props.theme === "success" },
        props.className,
      )}
    >
      {!props.loading && props.children}

      {props.loading && (
        <div className="grid justify-center">
          <div className="grid grid-cols-auto/1fr items-center gap-x-2">
            <span className="font-medium">Awaiting request</span>
          </div>
        </div>
      )}
    </pre>
  );
});
