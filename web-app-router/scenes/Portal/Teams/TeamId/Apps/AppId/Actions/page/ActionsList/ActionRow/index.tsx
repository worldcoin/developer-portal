import { CopyIcon } from "@/components/Icons/CopyIcon";
import { toast } from "react-toastify";
import { DetailsMenu } from "../DetailsMenu";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

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

  const copyAction = (event: any) => {
    event.stopPropagation();
    navigator.clipboard.writeText(action.action);
    toast.success("Copied to clipboard");
  };

  return [
    <div
      key={`${key}_1`}
      className="flex flex-row items-center gap-x-4 px-2 py-4 group w-[500px] "
    >
      <div className="uppercase rounded-full flex items-center justify-center h-12 w-12 bg-blue-100 text-blue-500">
        <Typography variant={TYPOGRAPHY.M3}>{action.name[0]}</Typography>
      </div>
      <div>
        <div className="text-grey-900 text-sm">
          <Typography variant={TYPOGRAPHY.R4}>{action.name}</Typography>
        </div>
        <div className="text-grey-500 flex items-center gap-x-2 ">
          <Typography variant={TYPOGRAPHY.R5}>{action.action}</Typography>
          <button
            className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300"
            onClick={copyAction}
          >
            <CopyIcon className="text-grey-500 w-5 h-5 hover:text-grey-700" />
          </button>
        </div>
      </div>
    </div>,
    <div className="w-[150px] " key={`${key}_2`}>
      <Typography variant={TYPOGRAPHY.R4}>{uses}</Typography>
    </div>,
    <div key={`${key}_3`} className="w-full flex justify-end px-2">
      <DetailsMenu path={pathName} />
    </div>,
  ];
};
