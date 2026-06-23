"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CodeBlock } from "./CodeBlock";

type TryActionProps = {
  action: {
    action: string;
    app_id: string;
    app: {
      engine: string;
    };
  };
};

export const TryAction = (props: TryActionProps) => {
  const { action } = props;

  return (
    <div className="grid h-full grid-rows-auto/1fr items-start gap-y-5 lg:w-[480px]">
      <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
        Try it out
      </Typography>
      <div className="size-full">
        <CodeBlock
          appId={action.app_id}
          action_identifier={action.action}
          engine={action.app.engine}
        />
      </div>
    </div>
  );
};
