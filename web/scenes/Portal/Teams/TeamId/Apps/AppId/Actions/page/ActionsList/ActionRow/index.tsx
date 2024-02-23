import { CopyButton } from "@/components/CopyButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DetailsMenu } from "../DetailsMenu";

export const ActionRow = (props: {
  action: any;
  key: number;
  pathName: string;
}) => {
  const { action, key, pathName } = props;
  const { nullifiers } = action;

  let uses = 0;
  for (const nullifier of nullifiers) {
    if (nullifier.uses) {
      uses += nullifier.uses;
    }
  }

  return [
    <div
      key={`${key}_1`}
      className="group flex flex-row items-center gap-x-4 px-2 py-4 md:w-[500px]"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 uppercase text-blue-500 ">
        <Typography variant={TYPOGRAPHY.M3}>{action.name[0]}</Typography>
      </div>
      <div className="max-w-[150px] md:max-w-[400px]">
        <div className="truncate text-sm text-grey-900">
          <Typography variant={TYPOGRAPHY.R4}>{action.name}</Typography>
        </div>
        <div className="flex items-center gap-x-2 truncate text-grey-500">
          <Typography variant={TYPOGRAPHY.R5} className="truncate">
            {action.action}
          </Typography>
          <CopyButton
            fieldValue={action.action}
            fieldName="Action identifier"
            className="cursor-pointer transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
          />
        </div>
      </div>
    </div>,
    <div className="md:w-[150px] " key={`${key}_2`}>
      <Typography variant={TYPOGRAPHY.R4}>{uses}</Typography>
    </div>,
    <div key={`${key}_3`} className="flex w-full justify-end px-2">
      <DetailsMenu path={pathName} />
    </div>,
  ];
};
