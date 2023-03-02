import cn from "classnames";
import { Button } from "src/components/LegacyButton";
import { Link } from "src/components/components/Link";
import { Dropdown } from "src/components/Dropdown";
import { useToggle } from "src/hooks/useToggle";
import { Modal } from "src/components/LegacyModal";
import { useActions, useValues } from "kea";
import { actionsLogic } from "src/logics/actionsLogic";
import { useRouter } from "next/router";
import { Fragment, memo, useCallback, useMemo } from "react";
import { ActionType } from "src/lib/types";
import { urls } from "src/lib/urls";

export const ActionDropdown = memo(function ActionDropdown(props: {
  action: ActionType;
  className?: string;
}) {
  const deleteModal = useToggle();
  const router = useRouter();
  const dropdown = useToggle();

  const isActionPage = useMemo(
    () => router.query.action_id === props.action.id,
    [props.action.id, router.query.action_id]
  );

  const { archiveAction, deleteAction } = useActions(actionsLogic);
  const { deletedActionLoading } = useValues(actionsLogic);

  const handleToggleArchive = useCallback(() => {
    archiveAction({
      action_id: props.action.id,
      value: !props.action.is_archived,
    });

    dropdown.toggleOff();
  }, [archiveAction, dropdown, props.action.id, props.action.is_archived]);

  const handleDelete = useCallback(() => {
    deleteAction({ action_id: props.action.id });

    dropdown.toggleOff();
  }, [deleteAction, dropdown, props.action.id]);

  const getItemClassName = useCallback(
    (className?: string) =>
      cn(
        "grid p-4 whitespace-nowrap w-full text-left hover:bg-d1d3d4/50 transition-colors",
        className
      ),
    []
  );

  return (
    <Fragment>
      <Dropdown
        className={props.className}
        toggler={dropdown}
        containerClassName="bg-ffffff rounded-lg shadow-lg z-50"
      >
        {!isActionPage && (
          <Link href={urls.home()} className={getItemClassName()}>
            Edit action
          </Link>
        )}

        <button
          className={getItemClassName("text-000000/50 hover:bg-d1d3d4/25")}
          onClick={handleToggleArchive}
        >
          {props.action.is_archived ? "Unarchive" : "Archive action"}
        </button>

        <button
          className={getItemClassName(
            "border-t border-t-f9f9f9 text-danger hover:bg-danger hover:text-ffffff hover:border-t-danger"
          )}
          onClick={deleteModal.toggleOn}
        >
          Delete action
        </button>
      </Dropdown>

      <Modal
        className="grid items-center gap-y-8 justify-items-center min-w-max !p-10"
        close={deleteModal.toggleOff}
        isShown={deleteModal.isOn}
      >
        <p className="text-20 max-w-sm">
          Are you sure you want to permanently delete&nbsp;
          <i>{props.action.name}</i>?<br />
          <b>This action cannot be undone.</b>
        </p>

        <div className="grid justify-center gap-y-3">
          <Button
            color="danger"
            variant="contained"
            onClick={handleDelete}
            disabled={deletedActionLoading}
          >
            Permanently delete
          </Button>

          <button
            onClick={deleteModal.toggleOff}
            className="text-neutral font-rubik hover:underline"
            disabled={deletedActionLoading}
          >
            Go back
          </button>
        </div>
      </Modal>
    </Fragment>
  );
});
