import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { memo } from "react";

export const Status = memo(function Status(props: { isActive: boolean }) {
  const { isActive } = props;

  return (
    <div>
      <div className="hidden size-4 items-center justify-center rounded-full bg-system-success-50 max-md:flex">
        <div className="size-2 rounded-full bg-system-success-400"></div>
      </div>

      <div className="hidden md:block">
        <div className="flex items-center">
          <div
            className={clsx(
              "w-fit  rounded-full  px-3 py-1",
              { "bg-green-50 text-green-500": isActive },
              {
                "bg-grey-50 text-grey-500": !isActive,
              },
            )}
          >
            <Typography variant={TYPOGRAPHY.S3}>
              {isActive ? "Active" : "Inactive"}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
});
