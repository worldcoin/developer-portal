import cn from "classnames";
import { Icon } from "common/Icon";
import { actionsLogicType } from "logics/actionsLogicType";
import { Link } from "common/components/Link";
import { useRouter } from "next/router";
import {
  ComponentType,
  HTMLAttributes,
  memo,
  MouseEventHandler,
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ActionType } from "types";
import { ActionDropdown } from "common/ActionDropdown";
import { urls } from "urls";
import { usePopperTooltip } from "react-popper-tooltip";
import { Tooltip } from "./Tooltip";

type ActionProps = {
  action: ActionType;
  cellRender: ComponentType<
    PropsWithChildren<
      { className?: string } & HTMLAttributes<HTMLTableCellElement>
    >
  >;
} & HTMLAttributes<HTMLTableRowElement>;

export const Action = memo(function Action(props: ActionProps) {
  const { action, cellRender: Cell, ...restProps } = props;

  const controlsCellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isActive = useMemo(
    () =>
      action.public_description.length > 0 &&
      (action.user_interfaces?.enabled_interfaces?.length || 0) > 0,
    [
      action.public_description,
      action.user_interfaces.enabled_interfaces?.length,
    ]
  );

  const hasKiosk = useMemo(() => {
    return (
      action.user_interfaces.enabled_interfaces?.filter(
        (item) => item === "kiosk"
      ).length || 0 > 0
    );
  }, [action.user_interfaces.enabled_interfaces]);

  const handleClick = useCallback<MouseEventHandler<HTMLTableRowElement>>(
    (e) => {
      if (controlsCellRef.current?.contains(e.target as HTMLElement)) {
        return;
      }

      router.push(urls.action(action.id));
    },
    [action.id, router]
  );

  const nameTooltip = usePopperTooltip({
    interactive: true,
    offset: [0, 14],
    placement: "top",
  });

  return (
    <tr
      {...restProps}
      className={cn(
        "relative cursor-pointer bg-transparent hover:bg-f1f5f8/50 transition-colors",
        restProps.className
      )}
      onClick={handleClick}
    >
      <Cell className="font-medium font-rubik max-w-[160px] first:pl-8 px-4">
        <Tooltip {...nameTooltip}>{action.name}</Tooltip>
        <span ref={nameTooltip.setTriggerRef}>{action.name}</span>
      </Cell>

      <Cell className="max-w-[130px]">{action.description}</Cell>

      <Cell className="px-4">
        <span className="flex items-center gap-x-2.5">
          <Icon className="w-5 h-5" name={action.engine} />
          <span className="first-letter:uppercase">{action.engine}</span>
        </span>
      </Cell>

      <Cell className="px-4">
        <span className="flex items-center gap-x-2.5">
          <Icon
            className="w-5 h-5"
            name={action.is_staging ? "chart" : "rocket"}
          />

          {action.is_staging ? "Staging" : "Production"}
        </span>
      </Cell>

      <Cell
        className={cn("px-4", {
          "text-success": isActive && !action.is_archived,
          "text-edbd14": !isActive && !action.is_archived,
          "!text-neutral": action.is_archived,
        })}
      >
        {isActive && !action.is_archived && "Active"}
        {!isActive && !action.is_archived && "Config missing"}
        {action.is_archived && "Archived"}
      </Cell>

      <Cell className="text-neutral-dark overflow-visible">
        <div
          ref={controlsCellRef}
          className="flex items-center justify-end gap-x-5"
        >
          {!action.is_archived && hasKiosk && (
            <Link
              className={cn(
                "flex items-center gap-x-1 px-3 py-2 rounded-xl border border-neutral-muted text-14",
                "text-primary hover:bg-primary hover:text-ffffff !transition-colors"
              )}
              href={`/kiosk/${action.id}`}
              target="_blank"
              data-analytics="btn-kiosk-list"
            >
              Kiosk <Icon className="w-4 h-4" name="external" />
            </Link>
          )}

          <ActionDropdown action={action} />
        </div>
      </Cell>
    </tr>
  );
});
