import cn from "classnames";
import { Input } from "scenes/action/ActionCard/Input";
import { Button } from "common/LegacyButton";
import { CardWithSideGradient } from "common/CardWithSideGradient";
import { Dropdown } from "common/Dropdown";
import { useToggle } from "hooks/useToggle";
import { Modal } from "common/LegacyModal";
import { Fragment, memo, useCallback } from "react";
import { AppType } from "types";
import { appLogicType } from "logics/appLogicType";

export const AppCard = memo(function AppCard(props: {
  app: AppType;
  deleteAction: () => void;
  updateAction: appLogicType["actions"]["updateApp"];
}) {
  const deleteModal = useToggle();

  const handleUpdate = useCallback(
    ({ attr, value }: { attr: string; value: string }) => {
      props.updateAction({ attr: attr as keyof AppType, value });
    },
    [props]
  );

  return (
    <Fragment>
      <CardWithSideGradient className="grid grid-flow-col auto-cols-max justify-between">
        <Input
          className="text-30 font-sora font-semibold py-1"
          dataValue={props.app.name}
          placeholder="App name"
          name={"name"}
          updateData={handleUpdate}
        />
        <Dropdown containerClassName="bg-ffffff rounded-lg shadow-lg z-50">
          <button
            className={cn(
              "grid p-4 whitespace-nowrap w-full text-left hover:bg-d1d3d4/50 transition-colors",
              "border-t border-t-f9f9f9 text-ff5a76 hover:bg-ff5a76 hover:text-ffffff hover:border-t-ff5a76"
            )}
            onClick={(e) => {
              e.preventDefault();
              deleteModal.toggleOn();
            }}
          >
            Delete App
          </button>
        </Dropdown>
      </CardWithSideGradient>

      <Modal
        className="grid items-center gap-y-8 justify-items-center min-w-max !p-10"
        close={deleteModal.toggleOff}
        isShown={deleteModal.isOn}
      >
        <p className="text-20 font-rubik">
          Are you sure you want to delete <b>{props.app.name}</b> app?
        </p>

        <div className="grid justify-center gap-y-3">
          <Button
            className="bg-ff5a76 text-ffffff"
            color="danger"
            variant="contained"
            onClick={props.deleteAction}
          >
            Permanently delete
          </Button>

          <button
            onClick={deleteModal.toggleOff}
            className="text-858494 font-rubik hover:underline"
            // FIXME: Implement loading state
          >
            Go back
          </button>
        </div>
      </Modal>
    </Fragment>
  );
});
