import cn from "classnames";
import { memo, useState } from "react";

enum Status {
  Online,
  Offline,
}

export const SystemStatus = memo(function SystemStatus() {
  const [status, _setStatus] = useState<Status>(Status.Online);

  const statusDescription = {
    [Status.Online]: "All systems are up and running",
    [Status.Offline]: "Some systems are down",
  };

  return (
    <div
      className={cn(
        "px-4 py-2.5 w-full grid items-center rounded-[10px] gap-x-3 grid-cols-auto/1fr",
        { "bg-success-light text-success": status === Status.Online },
        { "bg-danger-light text-danger": status === Status.Offline }
      )}
    >
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          { "bg-success": status === Status.Online },
          { "bg-danger": status === Status.Offline }
        )}
      />

      <span className="text-12">{statusDescription[status]}</span>
    </div>
  );
});
