import cn from "classnames";
import { Button } from "common/Button";
import dayjs from "dayjs";
import dayjsRelative from "dayjs/plugin/relativeTime";
import React, { memo, useCallback, useMemo } from "react";
import {
  getKioskStore,
  Screen,
  useKioskStore,
} from "../../../stores/kiosk-store";
import { StatusIcon } from "../common/StatusIcon";
dayjs.extend(dayjsRelative);

export const Success = memo(function Success(props: {
  confirmationId?: string;
  createdAt?: string;
}) {
  const { setScreen } = useKioskStore(getKioskStore);

  const handleRestart = useCallback(
    () => setScreen(Screen.Waiting),
    [setScreen]
  );

  const confirmedAt = useMemo(() => {
    if (!props.createdAt) return "recently";

    const date = dayjs(props.createdAt);
    return `${date.fromNow()}`;
  }, [props.createdAt]);

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
          <b>Confirmed at:</b> {confirmedAt}
        </p>

        <p>
          <b>Confirmation ID:</b> {props.confirmationId ?? <i>pending</i>}
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
