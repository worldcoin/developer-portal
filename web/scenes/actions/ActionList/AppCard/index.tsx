import { AppLogo } from "common/AppLogo";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { Widget } from "common/Widget";
import { memo } from "react";
import { AppType } from "types";
import cn from "classnames";
import { Action } from "../Action";
import { Link } from "common/Link";
import { useToggle } from "common/hooks";
import { appLogic } from "logics/appLogic";
import { useActions } from "kea";

export const AppCard = memo(function AppCard(props: {
  app: AppType;
  modalToggler: ReturnType<typeof useToggle>;
}) {
  const { loadApp } = useActions(appLogic);

  return (
    <Widget
      key={props.app.id}
      title=""
      className="mb-4"
      buttonClassName="hidden"
      childrenClassName="p-0"
    >
      <div className="grid grid-cols-1fr/auto w-full gap-x-4 px-8 py-4 items-center">
        <Link
          href={`/apps/${props.app.id}`}
          className="grid gap-x-4 content-center items-center grid-cols-auto/1fr"
        >
          <AppLogo
            className="w-[50px] h-[56px]"
            textClassName="text-16"
            app={props.app}
          />

          <div className="grid grid-flow-rows">
            <div className="text-191c20 font-sora font-semibold text-16 items-center">
              {props.app.name}
            </div>

            <div className="font-medium text-12 text-neutral leading-4 opacity-50">
              {props.app.actions.length}{" "}
              {props.app.actions.length === 1 ? "action" : "actions"}
            </div>
          </div>
        </Link>

        <div className="flex gap-x-2">
          {props.app.is_verified && (
            <Button
              className="h-8 px-3 font-medium border-3c4040 bg-191c20"
              variant="outlined"
              size="md"
              color="primary"
            >
              <Icon
                className="w-4 h-4 mr-1.5 text-primary"
                name="badge-check"
                noMask
              />
              <span className="text-ffffff">Verified</span>
            </Button>
          )}

          <Button
            className="h-8 px-3 font-medium border-primary/10 bg-primary/5"
            variant="outlined"
            size="md"
            color="primary"
            onClick={() => {
              loadApp({ app_id: props.app.id });
              props.modalToggler.toggleOn();
            }}
          >
            <Icon className="w-4 h-4 mr-1.5 text-primary" name="edit" />
            Edit
          </Button>
        </div>
      </div>

      {props.app.actions.length > 0 && (
        <div className="w-full overflow-auto">
          <table className={cn("relative w-full")}>
            <thead className="border-b border-neutral-muted text-neutral text-14 font-rubik font-medium text-left uppercase leading-4">
              <tr>
                {/*<th className="px-5 py-2 w-0 font-medium">App</th>*/}
                <th className="pl-8 px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Engine</th>
                <th className="px-4 py-2 font-medium">Environment</th>
                <th className="px-4 py-2 font-medium" colSpan={2}>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {props.app.actions.map((action, index, array) => (
                <Action
                  key={action.id}
                  action={action}
                  cellRender={(cellProps) => (
                    <td
                      className={cn(
                        "p-3 first:pl-5 last:pr-8 whitespace-nowrap overflow-hidden text-ellipsis",
                        {
                          "pt-5": index === 0,
                          "pb-5": index === array.length - 1,
                          "text-neutral-dark/30": action.is_archived,
                        },
                        cellProps.className
                      )}
                    >
                      {cellProps.children}
                    </td>
                  )}
                  className={cn({
                    "rounded-bl-xl rounded-br-xl": index === array.length - 1,
                  })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        className={cn(
          "grid grid-flow-col w-full h-14 px-7 items-center justify-start font-sora font-semibold text-14 text-ff6848 capitalize"
        )}
        href="/actions/new"
      >
        <Icon className="w-6 h-6 mr-2" name="plus" />
        Create New Action
      </Link>
    </Widget>
  );
});
