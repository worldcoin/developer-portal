import cn from "classnames";
import { memo, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import dayjsRelative from "dayjs/plugin/relativeTime";
import { StatusIcon } from "../common/StatusIcon";
dayjs.extend(dayjsRelative);

export const Success = memo(function Success(props: {
  setScreen: (screen: string) => void;
  confirmationId?: string;
  createdAt?: string;
}) {
  const handleRestart = useCallback(() => props.setScreen("waiting"), [props]);

  const confirmedAt = useMemo(() => {
    if (!props.createdAt) return "recently";

    const date = dayjs(props.createdAt);
    return `${date.fromNow()} (${date.format("HH-mm-ss, MMMMM YY")})`;
  }, [props.createdAt]);

  return (
    <div className="grid items-center text-center justify-items-center gap-y-12 lg:gap-y-8">
      <StatusIcon icon="check" />

      <div className="grid px-2 max-w-[300px] gap-y-4">
        <p className="font-sora font-semibold text-[26px] leading-[1.2]">
          Verified successfully!
        </p>

        <p className="px-1 text-neutral text-[18px] leading-[1.3]">
          We&apos;ve successfully verified unique humanness for this user.
        </p>
      </div>

      <div className="grid gap-y-2 leading-[1.2]">
        <p>
          <b>Confirmed at:</b> {confirmedAt}
        </p>

        <p>
          <b>Confirmation ID:</b> {props.confirmationId ?? <i>pending</i>}
        </p>
      </div>

      <button
        className={cn(
          "min-w-[320px] p-4.5 leading-[1.2] font-sora font-semibold uppercase transition-opacity rounded-xl bg-primary text-ffffff hover:opacity-70 shadow-[0px_10px_20px_rgba(83,_67,_212,_0.2),_inset_0px_-1px_1px_rgba(0,_0,_0,_0.3),_inset_0px_1px_1px_rgba(255,_255,_255,_0.2)]"
        )}
        onClick={handleRestart}
      >
        new verification
      </button>
    </div>
  );
});
