import { Button } from "common/LegacyButton";
import { Checkbox } from "common/components/Checkbox";
import { FieldInput } from "common/LegacyFieldInput";
import { Icon } from "common/Icon";
import { ListFilter } from "logics/actionsLogic";
import { actionsLogicType } from "logics/actionsLogicType";
import { ChangeEventHandler, memo, useCallback } from "react";
import { urls } from "urls";
import { Toggle } from "./Toggle";

export const Filter = memo(function Filter(props: {
  value: actionsLogicType["values"]["listFilter"];
  onUpdate: actionsLogicType["actions"]["updateListFilter"];
}) {
  const handleUpdateSearchQuery = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >(
    (e) => {
      props.onUpdate({ search_query: e.target.value }, true);
    },
    [props]
  );

  const handleUpdateStatus = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      props.onUpdate({ status: e.target.value as ListFilter["status"] }, true);
    },
    [props]
  );

  const handleChangeShowArchived = useCallback(
    (checked: boolean) => {
      props.onUpdate({ show_archived: checked }, true);
    },
    [props]
  );

  return (
    <div className="grid gap-x-4 gap-y-2 grid-col-1 2xl:grid-cols-[1fr_auto]">
      <FieldInput
        name="search_query"
        className="min-w-[260px] pl-12 text-14 order-first"
        containerClassName=""
        placeholder="Search for an action..."
        addon={
          <Icon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            name="search"
          />
        }
        value={props.value.search_query}
        onChange={handleUpdateSearchQuery}
      />

      <div className="grid grid-rows-3 lg:grid-rows-none lg:grid-flow-col lg:auto-cols-max gap-[inherit]">
        <Toggle
          name="status"
          onChange={handleUpdateStatus}
          options={[
            { value: "all", label: "All" },
            { value: "staging", label: "Staging" },
            { value: "production", label: "Production" },
          ]}
          value={props.value.status}
        />

        <Checkbox
          checked={props.value.show_archived || false}
          className="px-5 !gap-x-1 items-center whitespace-nowrap text-primary border border-neutral-muted rounded-xl"
          iconClassName="text-primary"
          label="Show archived"
          labelClassName=""
          onChange={handleChangeShowArchived}
          size="small"
        />

        <Button
          className="whitespace-nowrap"
          color="primary"
          component={"a"}
          href={urls.actionNew()}
          variant="contained"
        >
          Create new action
        </Button>
      </div>
    </div>
  );
});
