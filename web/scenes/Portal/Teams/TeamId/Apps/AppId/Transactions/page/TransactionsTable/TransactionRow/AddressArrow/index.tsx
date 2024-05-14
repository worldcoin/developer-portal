import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { TransactionStatus } from "@/lib/types";
import clsx from "clsx";
import { memo } from "react";

export const AddressArrow = memo(function AddressArrow(props: {
  status: string;
}) {
  const { status } = props;

  return (
    <div
      className={clsx(
        "flex size-8 items-center justify-center rounded-full p-1 text-sm",
        {
          "bg-system-success-50 text-system-success-500":
            status === TransactionStatus.Mined,
        },
        {
          "bg-system-warning-50 text-system-warning-700":
            status === TransactionStatus.Pending,
        },
        {
          "bg-system-error-100 text-system-error-700":
            status === TransactionStatus.Failed,
        },
      )}
    >
      <ArrowRightIcon />
    </div>
  );
});
