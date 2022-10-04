import { memo, useCallback } from "react";
import { ActionType } from "types";
import { actionsLogicType } from "logics/actionsLogicType";
import { actionLogicType } from "logics/actionLogicType";
import { Header } from "common/Header";
import { HeaderText } from "common/HeaderText";
import { Input } from "./Input";
import { Field } from "./Field";
import { Status } from "./Status";
import { Tabs } from "common/Tabs";
import { Tab } from "common/Tabs/types";

interface ActionHeaderInterface {
  action: ActionType;
  isLoading?: boolean;
  deleteAction?: actionsLogicType["actions"]["deleteAction"];
  updateAction?: actionLogicType["actions"]["updateAction"];
  tabs: Tab[];
  currentTab?: Tab;
  setTab: (tab: Tab) => void;
}

export const ActionHeader = memo(function ActionHeader(
  props: ActionHeaderInterface
) {
  const handleUpdate = useCallback(
    ({ attr, value }: { attr: string; value: string }) => {
      if (!(attr in props.action)) {
        return;
      }
      props.updateAction?.({ attr: attr as keyof ActionType, value });
    },
    [props]
  );

  return (
    <Header className="items-stretch">
      <HeaderText
        title={
          <Input
            className=""
            valueClassName="font-sora text-16 h-[20px]"
            name="name"
            placeholder="Name your action"
            value={props.action?.name}
            updateData={handleUpdate}
          />
        }
        description={
          <Input
            className=""
            valueClassName="text-14 h-[16px]"
            name="description"
            placeholder="Add a description"
            value={props.action?.description}
            updateData={handleUpdate}
          />
        }
      >
        <div className="grid grid-flow-col justify-start gap-8 mt-3.5 text-14 leading-4">
          <Field label="Action ID" value={props.action?.id} copyable />
          <Field
            icon="rocket"
            value={props.action?.is_staging ? "Staging" : "Production"}
            unchangeable
          />
          <Field
            icon="cloud"
            value={props.action?.engine}
            unchangeable
            valueClassName="capitalize"
          />
          {props.action && <Status action={props.action} />}
        </div>
      </HeaderText>
      <div className="grid grid-flow-row">
        <div></div>
        {props.action && props.currentTab && (
          <Tabs
            tabs={props.tabs}
            currentTab={props.currentTab}
            setTab={props.setTab}
            className="self-end"
            tabsClassName="!gap-x-8"
          />
        )}
      </div>
    </Header>
  );
});
