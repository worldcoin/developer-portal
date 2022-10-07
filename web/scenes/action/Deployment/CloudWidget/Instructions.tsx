import { memo } from "react";
import { JsWidgetInstructions } from "../Instructions/JsWidget";
import { ApiVerificationInstructions } from "../Instructions/ApiVerification";

export const CloudWidgetInstructions = memo(function CloudWidgetInstructions({
  actionId,
}: {
  actionId: string;
}): JSX.Element {
  return (
    <>
      <div className="p-8 bg-ffffff border border-neutral-muted rounded-xl">
        <JsWidgetInstructions actionId={actionId} />
      </div>

      <div className="mt-8 p-8 bg-ffffff border border-neutral-muted rounded-xl">
        <ApiVerificationInstructions actionId={actionId} />
      </div>
    </>
  );
});
