import { CodeBlock } from "common/CodeBlock";
import { Icon } from "common/Icon";
import { memo } from "react";
import { text } from "common/styles";

export const APIInstructions = memo(function APIInstructions({
  actionId,
}: {
  actionId: string;
}): JSX.Element {
  const deploymentInstructionsHeaders = `{
    "Content-Type": "application/json"
}`;

  const deploymentInstructionsBody = `{
    "action_id": "${actionId}",
    "signal": "<your_signal>",
    "proof": "<as_received_from_the_widget>",
    "nullifier_hash": "<as_received_from_the_widget>",
    "merkle_root": "<as_received_from_the_widget>"
}`;

  const deploymentInstructionsResponse = `{
    "success": true,
    "nullifier_hash": "nil_c94ee7a8954a4f18effc179cfd76b992",
    "created_at": "2022-06-22T11:23:23.931Z"
}`;

  return (
    <div className="grid gap-y-6">
      <CodeBlock
        code="POST https://developer.worldcoin.org/api/v1/verify"
        language="bash"
        theme="neutral"
        caption="HTTP Request"
        captionClassName={text.caption}
      />

      <CodeBlock
        code={deploymentInstructionsHeaders}
        language="json"
        theme="neutral"
        caption="Headers"
        captionClassName={text.caption}
      />

      <CodeBlock
        code={deploymentInstructionsBody}
        language="json"
        theme="neutral"
        caption="Body"
        captionClassName={text.caption}
      />

      <CodeBlock
        code={deploymentInstructionsResponse}
        language="json"
        theme="neutral"
        caption="Response"
        captionClassName={text.caption}
      />
    </div>
  );
});
