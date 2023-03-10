import { Switch } from "src/components/Switch";
import { memo, useCallback, useMemo } from "react";
import cn from "classnames";
import { Icon } from "src/components/Icon";
import useSignInAction from "src/hooks/useSignInAction";

export const Status = memo(function Status() {
  const { action, updateAction } = useSignInAction();

  const enabled = useMemo(() => action?.status === "active", [action?.status]);

  const toggleStatus = useCallback(
    () => updateAction({ status: enabled ? "inactive" : "active" }),
    [enabled, updateAction]
  );

  return (
    <section
      className={cn(
        "p-4 border  transition-colors rounded-2xl flex justify-between items-center",
        {
          "border-primary bg-primary": enabled,
          "border-ebecef bg-f9fafb": !enabled,
        }
      )}
    >
      <div className="grid grid-rows-2 grid-flow-col justify-start gap-x-4">
        <div
          className={cn(
            "p-4 rounded-full text-0 row-span-2 transition-colors",
            {
              "bg-ebecef": !enabled,
              "bg-primary-light": enabled,
            }
          )}
        >
          <Icon
            name="world-id-sign-in"
            className={cn("w-[22px] h-[22px] transition-colors", {
              "text-primary": enabled,
            })}
          />
        </div>

        <span
          className={cn(
            "text-sora font-medium leading-none self-end transition-colors",
            {
              "text-ffffff": enabled,
            }
          )}
        >
          Sign in with World ID
        </span>
        <span
          className={cn("uppercase text-12 self-start transition-colors", {
            "text-ffffff": enabled,
          })}
        >
          Authenticate users with World ID
        </span>
      </div>

      <Switch
        checked={enabled}
        toggle={toggleStatus}
        customColors={{ checked: "bg-[#182D96]" }}
      />
    </section>
  );
});
