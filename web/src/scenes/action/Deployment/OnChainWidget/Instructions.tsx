import { memo } from "react";
import { SmartContractInstructions } from "../Instructions/SmartContract";
import { JsWidgetInstructions } from "../Instructions/JsWidget";

export const OnChainWidgetInstructions = memo(
  function OnChainWidgetInstructions({
    actionId,
  }: {
    actionId: string;
  }): JSX.Element {
    return (
      <>
        <div className="p-8 bg-ffffff border border-neutral-muted rounded-xl">
          <SmartContractInstructions />
        </div>

        <div className="mt-8 p-8 bg-ffffff border border-neutral-muted rounded-xl">
          <JsWidgetInstructions actionId={actionId} />
        </div>
      </>
    );
  }
);
