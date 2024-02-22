import { Switcher } from "@/components/Switch";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

export const AppStatus = (props: {
  disabled?: boolean;
  status: boolean;
  setStatus: (status: boolean) => void;
}) => {
  const { disabled, status, setStatus } = props;

  return (
    <div className="grid grid-cols-auto/1fr/auto gap-x-4 rounded-xl border-[1px] p-5">
      <Switcher enabled={status} setEnabled={setStatus} disabled={disabled} />
      <div className="grid gap-y-2 ">
        <Typography variant={TYPOGRAPHY.R3}>Activate the App</Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
          Enables users to verify with World ID for this app
        </Typography>
      </div>
      <div
        className={clsx(
          "grid h-fit grid-cols-auto/1fr items-center gap-x-1.5 rounded-xl px-3 py-1 ",
          {
            "bg-system-success-50 text-system-success-500": status,
            "bg-gray-50 text-grey-400": !status,
          },
        )}
      >
        <div
          className={clsx("size-2 rounded-full", {
            "bg-system-success-500": status,
            "bg-grey-400": !status,
          })}
        />
        <Typography variant={TYPOGRAPHY.S3}>
          {status ? "Active" : "Inactive"}
        </Typography>
      </div>
    </div>
  );
};
