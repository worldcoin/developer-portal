import { memo, MouseEventHandler, useCallback, useMemo } from "react";
import { ActionType } from "src/lib/types";
import { useRouter } from "next/router";
import { urls } from "src/lib/urls";
import cn from "classnames";

interface StatusInterface {
  className?: string;
  action: ActionType;
}

export const Status = memo(function Status(props: StatusInterface) {
  const router = useRouter();

  const actionEditLink = useMemo(() => urls.actions("custom"), []);

  const handleClickAwaitingDeployment = useCallback<
    MouseEventHandler<HTMLSpanElement>
  >(
    (e) => {
      e.preventDefault();
      if (!props.action.user_interfaces.enabled_interfaces?.length) {
        router.push(`${actionEditLink}#saveActionUserInterface`);
        return;
      }
      if (props.action.public_description.length <= 0) {
        router.push(`${actionEditLink}#saveActionDisplaySettings`);
      }
    },
    [
      actionEditLink,
      props.action.public_description.length,
      props.action.user_interfaces.enabled_interfaces?.length,
      router,
    ]
  );

  return (
    <div
      className={cn(
        "grid items-center grid-cols-auto/1fr gap-x-2 whitespace-nowrap",
        {
          "text-danger":
            !props.action?.is_archived && props.action?.status === "created",
        },
        {
          "text-success":
            !props.action?.is_archived && props.action?.status === "active",
        },
        {
          "text-neutral":
            !props.action?.is_archived && props.action?.status === "inactive",
        },
        { "text-neutral": props.action?.is_archived }
      )}
    >
      <div className="w-2 h-2 bg-current rounded-full" />
      {props.action?.is_archived ? (
        <span className="leading-none">Archived</span>
      ) : (
        <>
          {props.action?.status === "created" && (
            <span
              onClick={handleClickAwaitingDeployment}
              className="leading-4 cursor-pointer"
            >
              Config missing
            </span>
          )}

          {props.action?.status === "inactive" && (
            <span className="leading-4">Inactive</span>
          )}

          {props.action?.status === "active" && (
            <span className="leading-4">Active</span>
          )}
        </>
      )}
    </div>
  );
});
