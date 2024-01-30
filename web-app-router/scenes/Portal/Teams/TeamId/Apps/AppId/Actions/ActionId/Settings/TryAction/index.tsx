"use client";

import { Button } from "@/components/Button";
import { CodeIcon } from "@/components/Icons/CodeIcon";
import { QRIcon } from "@/components/Icons/QRIcon";
import { MiniKiosk } from "./MiniKiosk";

type TryActionProps = {
  action: {
    name: string;
    description: string;
    action: string;
    app_id: string;
    app: { is_staging: boolean };
  };
};

export const TryAction = (props: TryActionProps) => {
  const { action } = props;
  return (
    <div className="w-full h-full gap-y-5 grid grid-rows-auto/1fr items-start">
      <div className="grid grid-cols-2 justify-between w-full items-center">
        <h1 className="text-grey-900 font-[550]">Try it out</h1>
        <div className="w-full justify-end flex gap-x-4">
          <Button
            type="button"
            className="w-11 h-11 bg-white rounded-xl border-grey-100 border shadow-button hover:bg-grey-50 justify-center items-center flex"
          >
            <QRIcon className="text-blue-500 h-4 w-4" />
          </Button>
          <Button
            type="button"
            className="w-11 h-11 bg-white rounded-xl border-grey-100 border shadow-button hover:bg-grey-50 justify-center items-center flex"
          >
            <CodeIcon className="text-grey-700 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-full ">
        <MiniKiosk action={action} />
      </div>
    </div>
  );
};
