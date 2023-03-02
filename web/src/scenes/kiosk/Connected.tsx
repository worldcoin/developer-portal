import cn from "classnames";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { Modal } from "common/LegacyModal";
import { Fragment, memo, useCallback, useState } from "react";
import { getKioskStore, useKioskStore } from "../../../stores/kioskStore";

export const Connected = memo(function Connected({
  reset,
}: {
  reset: () => void;
}) {
  const { setScreen } = useKioskStore(getKioskStore);

  const [isModalShow, setIsModalShow] = useState(false);
  const hideModal = useCallback(() => setIsModalShow(false), []);
  const showModal = useCallback(() => setIsModalShow(true), []);

  const handleRestart = useCallback(() => {
    reset();
    setScreen(Screen.Waiting);
  }, [reset, setScreen]);

  return (
    <Fragment>
      <div className="grid grid-flow-row text-center justify-center auto-cols-min gap-y-12 justify-items-center">
        <Icon className="w-16 h-16 animate-spin" name="spinner" noMask />

        <div className="grid gap-y-4">
          <p className="font-sora text-[26px] leading-[1.2] font-semibold">
            Connected!
          </p>
          <p className="text-neutral">Awaiting confirmation from user</p>
        </div>

        <Button
          className={cn(
            "min-w-[320px] p-4.5 uppercase font-sora font-semibold leading-[1.2]"
          )}
          onClick={showModal}
        >
          restart
        </Button>
      </div>

      <Modal
        className="grid text-center justify-items-center gap-y-12"
        close={hideModal}
        isShown={isModalShow}
      >
        <Icon className="w-48 h-8" name="worldcoin" />

        <div className="grid px-5 gap-y-4">
          <p className="font-sora font-semibold text-[26px] leading-[1.2]">
            Are you sure you want to restart?
          </p>

          <p className="leading-[1.2]">
            This will terminate the connection to the Worldcoin app and the user
            will have to start over.
          </p>
        </div>

        <div className="grid w-full gap-y-8">
          <button
            className={cn(
              "uppercase p-4.5 text-ffffff bg-primary rounded-xl font-semibold leading-[1.2]",
              "shadow-[0px_10px_20px_rgba(83,_67,_212,_0.2),_inset_0px_-1px_1px_rgba(0,_0,_0,_0.3),_inset_0px_1px_1px_rgba(255,_255,_255,_0.2)]",
              "hover:opacity-70 transition-opacity"
            )}
            onClick={handleRestart}
          >
            confirm
          </button>

          <button
            className={cn(
              "font-sora leading-[1.2] text-neutral font-semibold hover:opacity-70 transition-opacity"
            )}
            onClick={hideModal}
          >
            Dismiss
          </button>
        </div>
      </Modal>
    </Fragment>
  );
});
