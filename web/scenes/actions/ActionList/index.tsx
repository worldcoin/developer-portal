import { FormEvent, memo } from "react";
import { actionsLogic, ListFilter } from "logics/actionsLogic";
import { useActions, useValues } from "kea";
import { Filter } from "./Filter";
import { Widget } from "common/Widget";
import cn from "classnames";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Icon } from "common/Icon";
import { styles, text } from "common/styles";
import { Link } from "common/components/Link";
import { appsLogic } from "logics/appsLogic";
import { AppCard } from "./AppCard";
import { Modal } from "common/LegacyModal";
import { useToggle } from "common/hooks";
import { Field, Form } from "kea-forms";
import { Button } from "common/LegacyButton";
import { InputError } from "common/InputError";
import { appLogic } from "logics/appLogic";

export const ActionList = memo(function ActionList(props: {
  withoutCreateButton?: boolean;
}) {
  const { updateListFilter } = useActions(actionsLogic);
  const { filteredAppsList, listFilter } = useValues(appsLogic);
  const editModal = useToggle();
  const router = useRouter();
  const { app } = useValues(appLogic);
  const { updateAppHasErrors, updateAppTouched, isUpdateAppSubmitting } =
    useValues(appLogic);

  const { submitUpdateApp } = useActions(appLogic);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitUpdateApp();
      editModal.toggleOff();
    },
    [editModal, submitUpdateApp]
  );

  const isDisabled =
    (updateAppHasErrors && updateAppTouched) || isUpdateAppSubmitting;

  // @ANCHOR: Read filters from query params
  useEffect(() => {
    updateListFilter({
      app_id: router.query.app_id || null,
      search_query: router.query.search_query || "",
      status: router.query.status || "all",
      show_archived: router.query.show_archived == "1",
    } as ListFilter);
  }, [
    router.query.app_id,
    router.query.search_query,
    router.query.show_archived,
    router.query.status,
    updateListFilter,
  ]);

  // @ANCHOR: Set filters to query params
  const handleUpdateFilters = useCallback(
    (values: ListFilter, merge: boolean = true) => {
      const result = merge ? { ...listFilter, ...values } : values;

      const query = {
        ...(result.app_id ? { app_id: result.app_id } : {}),
        ...(result.search_query ? { search_query: result.search_query } : {}),

        ...(result.status && result.status !== "all"
          ? { status: result.status }
          : {}),

        ...(result.show_archived ? { show_archived: "1" } : {}),
      };

      router.push({ query }, undefined, { shallow: true });
    },
    [listFilter, router]
  );

  return (
    <>
      <Widget title="" className="mb-8" buttonClassName="hidden">
        <Filter value={listFilter} onUpdate={handleUpdateFilters} />
      </Widget>

      <h3 className={cn(text.h3, "mb-8")}>All apps and actions</h3>

      {filteredAppsList.map((app) => (
        <AppCard modalToggler={editModal} key={app.id} app={app} />
      ))}

      {!props.withoutCreateButton && (
        <Link
          className={cn(
            styles.container.shadowBox,
            "grid grid-flow-col w-full h-14 items-center justify-center font-sora font-semibold text-14 text-primary capitalize"
          )}
          href="/apps/new"
        >
          <Icon className="w-6 h-6 mr-2" name="plus" />
          Create New App
        </Link>
      )}

      <Modal
        className="grid items-center gap-y-4 justify-items-center min-w-[500px] !p-8"
        close={editModal.toggleOff}
        isShown={editModal.isOn}
        withCloseButton
        heading={app?.name}
      >
        <Form
          className="grid gap-y-4 justify-items-end w-full"
          logic={appLogic}
          formKey="updateApp"
          enableFormOnSubmit
          onSubmit={handleSubmit}
        >
          <label className="grid gap-y-4 font-rubik leading-tight w-full">
            <span className="text-16 font-medium">Name</span>

            <Field noStyle name="name">
              {({ value, onChange, error }) => (
                <div className="grid gap-y-2">
                  <input
                    type="text"
                    name="name"
                    className={cn("p-5 text-14 w-full", styles.container.flat, {
                      "border-ff5a76": error,
                    })}
                    onChange={(e) => onChange(e.target.value)}
                    value={value}
                    autoFocus
                  />

                  <InputError error={error} />
                </div>
              )}
            </Field>
          </label>

          <Button
            type="submit"
            disabled={isDisabled}
            fullWidth
            color="primary"
            variant="contained"
          >
            update app
          </Button>
        </Form>
      </Modal>
    </>
  );
});
