import { Fragment, memo, MouseEventHandler, useCallback, useMemo } from "react";
import { ActionType } from "types";
import { CardWithSideGradient } from "src/common/CardWithSideGradient";
import cn from "classnames";
import { Field } from "./Field";
import { Input } from "./Input";
import { text } from "src/common/styles";
import { urls } from "urls";
import { useRouter } from "next/router";
import { ActionDropdown } from "src/common/ActionDropdown";
import { actionsLogicType } from "src/logics/actionsLogicType";
import { actionLogicType } from "src/logics/actionLogicType";

export const ActionCard = memo(function ActionCard(props: {
  action: ActionType;
  deleteAction?: actionsLogicType["actions"]["deleteAction"];
  isLoading?: boolean;
  updateAction?: actionLogicType["actions"]["updateAction"];
}) {
  const router = useRouter();

  const actionEditLink = useMemo(() => urls.actions("custom"), []);

  const handleUpdateField = useCallback(
    ({ attr, value }: { attr: string; value: string }) => {
      if (!(attr in props.action)) {
        return;
      }
      props.updateAction?.({ attr: attr as keyof ActionType, value });
    },
    [props]
  );

  const handleClickAwaitingDeployment = useCallback<
    MouseEventHandler<HTMLSpanElement>
  >(
    (e) => {
      e.preventDefault();
      if (!props.action.user_interfaces.enabled_interfaces?.length) {
        router.push(`${actionEditLink}/deployment#saveActionUserInterface`);
        return;
      }
      if (props.action.public_description.length <= 0) {
        router.push(`${actionEditLink}/display#saveActionDisplaySettings`);
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
    <CardWithSideGradient>
      <div className="relative grid gap-y-4 lg:gap-y-10">
        <div className="relative top-0 right-0 grid items-center justify-between grid-flow-col lg:absolute gap-x-5 auto-cols-max">
          <div
            className={cn("grid items-center grid-cols-auto/1fr gap-x-2", {
              [`${cn({
                "text-danger": props.action.status === "created",
                "text-success": props.action.status === "active",
                "text-neutral": props.action.status === "inactive",
              })}`]: !props.action.is_archived,
              "text-neutral": props.action.is_archived,
            })}
          >
            <div className="w-2 h-2 bg-current rounded-full" />

            {props.action.is_archived ? (
              <span className="leading-none">Archived</span>
            ) : (
              <Fragment>
                {props.action.status === "created" && (
                  <span
                    onClick={handleClickAwaitingDeployment}
                    className="leading-none cursor-pointer"
                  >
                    Config missing
                  </span>
                )}

                {props.action.status === "inactive" && (
                  <span className="leading-none">Inactive</span>
                )}

                {props.action.status === "active" && (
                  <span className="leading-none">Active</span>
                )}
              </Fragment>
            )}
          </div>

          <ActionDropdown action={props.action} />
        </div>

        <div className="grid gap-y-3">
          <Input
            className={cn(text.h1, "leading-none")}
            dataValue={props.action.name}
            loading={props.isLoading}
            name="name"
            updateData={handleUpdateField}
            placeholder="Name your action"
          />

          <Input
            className="leading-tight font-sora text-neutral"
            dataValue={props.action.description}
            loading={props.isLoading}
            name="description"
            updateData={handleUpdateField}
            placeholder="Add a description"
          />
        </div>

        <div className="flex flex-wrap gap-y-2 gap-x-8">
          <Field name="Action ID" value={props.action.id} copyable />

          <Field
            icon="cloud"
            name="Engine"
            tooltip="To change these settings, you need to create a new action."
            value={props.action.engine}
          />

          <Field
            fieldClassName={cn(
              {
                "text-primary !border-primary/80 !bg-primary/10":
                  !props.action.is_staging,
              },
              {
                "text-[#edbd14] !border-[#edbd14]/80 !bg-[#edbd14]/10":
                  props.action.is_staging,
              }
            )}
            icon="rocket"
            name="Environment"
            tooltip="To change these settings, you need to create a new action."
            value={props.action.is_staging ? "Staging" : "Production"}
          />
        </div>
      </div>
    </CardWithSideGradient>
  );
});
