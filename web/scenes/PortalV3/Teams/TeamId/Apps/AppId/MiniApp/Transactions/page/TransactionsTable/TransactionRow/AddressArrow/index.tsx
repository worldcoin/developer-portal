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
          "bg-surface-success-50 text-content-success-500":
            status === TransactionStatus.Mined,
        },
        {
          "bg-surface-warning-50 text-content-warning-700":
            status === TransactionStatus.Pending,
        },
        {
          "bg-surface-error-100 text-content-error-700":
            status === TransactionStatus.Failed,
        },
      )}
    >
      <ArrowRightIcon />
    </div>
  );
});
