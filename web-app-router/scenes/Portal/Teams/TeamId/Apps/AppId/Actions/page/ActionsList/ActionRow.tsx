import { CopyIcon } from "@/components/Icons/CopyIcon";
import { ElementsIcon } from "@/components/Icons/ElementsIcon";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { DetailsMenu } from "./DetailsMenu";
import { usePathname } from "next/navigation";

export const ActionRow = (props: { action: any; key: number }) => {
  const { action, key } = props;
  const { nullifiers } = action;
  const pathName = usePathname();

  const uses = useMemo(() => {
    let uses = 0;
    for (const nullifier of nullifiers) {
      if (!nullifier.uses) {
        continue;
      }
      uses += nullifier.uses;
    }
    return uses;
  }, [nullifiers]);

  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(action.action);
    toast.success("Copied to clipboard");
  }, [action]);

  return [
    <div key={key} className="flex flex-row items-center gap-x-4 px-2 group">
      <div className="uppercase rounded-full flex items-center justify-center h-12 w-12 bg-blue-100 text-blue-500 text-base font-[500]">
        {action.name[0]}
      </div>
      <div>
        <div className="text-grey-900 text-sm">{action.name}</div>
        <div className="text-grey-500 text-xs flex items-center justify-center gap-x-2 ">
          {action.action}
          <button
            className="invisible group-hover:visible cursor-pointer"
            onClick={copyAction}
          >
            <CopyIcon className="text-grey-500 w-5 h-5 hover:text-grey-700" />
          </button>
        </div>
      </div>
    </div>,
    <span className="text-sm" key={key}>
      {uses}
    </span>,
    <div key={key} className="w-full flex justify-end px-2">
      <DetailsMenu path={`${pathName}/${action.id}`} />
    </div>,
  ];
};
