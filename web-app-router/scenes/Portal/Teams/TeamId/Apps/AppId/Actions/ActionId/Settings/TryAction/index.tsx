"use client";

import { Button } from "@/components/Button";
import { CodeIcon } from "@/components/Icons/CodeIcon";
import { QRIcon } from "@/components/Icons/QRIcon";
import { MiniKiosk } from "./MiniKiosk";
import { useState } from "react";
import clsx from "clsx";
import { CodeBlock } from "./CodeBlock";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type TryActionProps = {
  action: {
    name: string;
    description: string;
    action: string;
    app_id: string;
    app: { is_staging: boolean; engine: string };
  };
};

export const TryAction = (props: TryActionProps) => {
  const { action } = props;
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="h-full gap-y-5 grid grid-rows-auto/1fr items-start lg:w-[480px]">
      <div className="grid grid-cols-2 justify-between w-full items-center">
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          Try it out
        </Typography>
        <div className="w-full justify-end flex gap-x-4">
          <Button
            type="button"
            onClick={() => setShowCode(false)}
            className={clsx(
              "w-11 h-11 bg-white rounded-xl shadow-button hover:bg-grey-50 justify-center items-center flex",
              { "border border-grey-200": !showCode },
            )}
          >
            <QRIcon
              className={clsx(" h-4 w-4", {
                "text-blue-500": !showCode,
                "text-grey-700": showCode,
              })}
            />
          </Button>
          <Button
            type="button"
            onClick={() => setShowCode(true)}
            className={clsx(
              "w-11 h-11 bg-white rounded-xl shadow-button hover:bg-grey-50 justify-center items-center flex",
              { "border border-grey-200": showCode },
            )}
          >
            <CodeIcon
              className={clsx(" h-4 w-4", {
                "text-blue-500 ": showCode,
                "text-grey-700": !showCode,
              })}
            />
          </Button>
        </div>
      </div>
      <div className="h-full w-full">
        {showCode ? (
          <CodeBlock
            appId={action.app_id}
            action_identifier={action.action}
            engine={action.app.engine}
          />
        ) : (
          <MiniKiosk action={action} />
        )}
      </div>
    </div>
  );
};
