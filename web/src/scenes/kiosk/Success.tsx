import cn from "classnames";
import dayjs from "dayjs";
import dayjsRelative from "dayjs/plugin/relativeTime";
import { memo, useCallback } from "react";
import { Button } from "src/components/Button";
import { StatusIcon } from "src/scenes/kiosk/common/StatusIcon";
import { IKioskStore, KioskScreen, useKioskStore } from "src/stores/kioskStore";
dayjs.extend(dayjsRelative);

const getKioskStoreParams = (store: IKioskStore) => ({
  setScreen: store.setScreen,
  successParams: store.successParams,
});

export const Success = memo(function Success() {
  const { setScreen, successParams } = useKioskStore(getKioskStoreParams);

  const handleRestart = useCallback(
    () => setScreen(KioskScreen.Waiting),
    [setScreen]
  );

  return (
    <div className="grid items-center text-center justify-items-center gap-y-6">
      <StatusIcon icon="check" />

      <div className="grid px-2 max-w-[300px] gap-y-4">
        <p className="font-sora font-semibold text-[26px] leading-[1.2]">
          Verified successfully!
        </p>

        <p className="font-rubik px-1 text-neutral text-[18px] leading-[1.3]">
          You are a human doing only this once
        </p>
      </div>

      <div className="font-rubik grid gap-y-2 leading-[1.2]">
        <p>
          <b>Confirmed at:</b>{" "}
          {successParams?.timestamp.fromNow() ?? "recently"}
        </p>

        <p>
          <b>Confirmation ID:</b>{" "}
          {successParams?.confirmationCode ?? <i>pending</i>}
        </p>
      </div>

      <Button
        className={cn(
          "min-w-[320px] p-4.5 leading-[1.2] font-sora font-semibold uppercase transition-opacity rounded-xl"
        )}
        onClick={handleRestart}
      >
        new verification
      </Button>
    </div>
  );
});
