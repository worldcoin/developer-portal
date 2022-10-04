import { memo } from "react";
import { KioskOverview } from "./Overview";
import { KioskAccess } from "./Access";
import { actionLogic } from "logics/actionLogic";

export const Kiosk = memo(function Kiosk(props: {
  url?: string;
  enableUserInterface: typeof actionLogic.actions.enableUserInterface;
  deploymentStep?: string;
}) {
  return (
    <div className="grid gap-y-8 mt-4">
      <KioskAccess url={props.url} deploymentStep={props.deploymentStep} />
    </div>
  );
});
