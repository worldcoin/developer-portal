import { ApproveSandboxRequestButton } from "./ApproveSandboxRequestButton";
import { RejectSandboxRequestButton } from "./RejectSandboxRequestButton";

export const SandboxRequestActions = (props: { requestId: string }) => (
  <div className="flex flex-wrap items-center gap-2">
    <ApproveSandboxRequestButton requestId={props.requestId} />
    <RejectSandboxRequestButton requestId={props.requestId} />
  </div>
);
