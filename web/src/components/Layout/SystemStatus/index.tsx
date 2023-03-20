import cn from "classnames";
import { memo } from "react";
import { useUptimeRobot } from "src/hooks/useUptimeRobot";
import { GetMonitorsResponse } from "src/pages/api/status";

export const SystemStatus = memo(function SystemStatus() {
  const { status, error: systemStatusError } = useUptimeRobot();

  const statusDescription: { [key in GetMonitorsResponse["stat"]]: string } = {
    ok: "All systems are up and running",
    fail: "Some systems are down",
  };

  return !systemStatusError && status ? (
    <div
      className={cn(
        "px-4 py-2.5 w-full grid items-center rounded-[10px] gap-x-3 grid-cols-auto/1fr",
        { "bg-success-light text-success": status.stat === "ok" },
        { "bg-danger-light text-danger": status.stat === "fail" }
      )}
    >
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          { "bg-success": status.stat === "ok" },
          { "bg-danger": status.stat === "fail" }
        )}
      />

      <span className="text-12">{statusDescription[status.stat]}</span>
    </div>
  ) : null;
});
