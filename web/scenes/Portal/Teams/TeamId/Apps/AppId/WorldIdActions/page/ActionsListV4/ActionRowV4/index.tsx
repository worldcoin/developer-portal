import { CopyButton } from "@/components/CopyButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { ActionAvatar } from "../ActionAvatar";

type ActionRowV4Props = {
  action: {
    id: string;
    action: string;
    description: string;
    uses: number;
    environment: "staging" | "production";
  };
};

export const ActionRowV4 = (props: ActionRowV4Props) => {
  const { action } = props;

  return (
    <div
      className={clsx(
        "group max-md:grid max-md:grid-cols-1fr/auto max-md:rounded-2xl max-md:border max-md:px-2 max-md:hover:bg-grey-25 md:contents [&>*]:border-gray-100 [&>*]:px-2 md:[&>*]:border-b",
      )}
    >
      <div className="grid grid-cols-auto/1fr items-center gap-x-4 py-4 md:group-hover:bg-grey-25">
        <ActionAvatar
          identifier={action.action}
          environment={action.environment}
        />

        <div className="grid gap-y-0.5">
          <div className="flex items-center gap-x-1">
            <Typography variant={TYPOGRAPHY.R3} className="truncate">
              {action.action}
            </Typography>

            <CopyButton
              fieldValue={action.action}
              fieldName="Action identifier"
              className="cursor-pointer opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </div>

          {action.description && (
            <Typography
              variant={TYPOGRAPHY.R4}
              className="truncate text-grey-500"
            >
              {action.description}
            </Typography>
          )}
        </div>
      </div>

      <div className="grid items-center md:group-hover:bg-grey-25">
        <Typography variant={TYPOGRAPHY.R4} className="truncate text-grey-500">
          {action.uses.toLocaleString()}
        </Typography>
      </div>
    </div>
  );
};
