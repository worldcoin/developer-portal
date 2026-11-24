import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TransactionStatus } from "@/lib/types";
import clsx from "clsx";
import { memo } from "react";

export const TransactionStatusBadge = memo(function Status(props: {
  status: string;
}) {
  const { status } = props;

  return (
    <div>
      <div className="">
        <div className="flex items-center">
          <div
            className={clsx(
              "w-fit rounded-full px-3 py-1",
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
            <Typography variant={TYPOGRAPHY.S3} className="capitalize">
              {status}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
});
