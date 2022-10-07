import { CodeBlock } from "common/CodeBlock";
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
    <>
      <div className="p-8 bg-ffffff border border-neutral-muted rounded-xl">
        <h2 className="font-sora font-semibold text-20 leading-6 text-primary">
          1. Integrate the JS widget on your frontend
        </h2>

        <h3 className="mt-6 font-sora font-semibold text-16 leading-5">
          Install the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            "yarn add @worldcoin/id" +
            "\n" +
            "# or" +
            "\n" +
            "npm install @worldcoin/id"
          }
          language="bash"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Add an element to which to mount the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={'<div id="world-id-container"></div>'}
          language="bash"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Add an element to which to mount the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            'worldID.init("world-id-container", {' +
            "\n" +
            "  enable_telemetry: true," +
            "\n" +
            '  action_id: "' +
            actionId +
            '",' +
            "\n" +
            '  signal: "yourSignal" // <- Set an appropriate signal for each user' +
            "\n" +
            "});"
          }
          language="javascript"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Enable the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            'document.addEventListener("DOMContentLoaded", async function () {' +
            "\n" +
            "  try {" +
            "\n" +
            "    const result = await worldID.enable(); // <- Send 'result' to your backend or sm" +
            "\n" +
            "  } catch (failure) {" +
            "\n" +
            '    console.warn("World ID verification failed:", failure);' +
            "\n" +
            "    // Re-activate here so your end user can try again" +
            "\n" +
            "});"
          }
          language="javascript"
          theme="neutral"
          hideLineNumbers
        />
      </div>

      <div className="mt-8 p-8 bg-ffffff border border-neutral-muted rounded-xl">
        <h2 className="font-sora font-semibold text-20 leading-6 text-primary">
          2. Verify the proof with the API
        </h2>
        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Add an element to which to mount the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            'worldID.init("world-id-container", {' +
            "\n" +
            "  enable_telemetry: true," +
            "\n" +
            '  action_id: "' +
            actionId +
            '",' +
            "\n" +
            '  signal: "yourSignal" // <- Set an appropriate signal for each user' +
            "\n" +
            "});"
          }
          language="javascript"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Enable the widget
        </h3>
        <p className="text-14 text-neutral leading-4">
          Instruction goes here, if needed.
        </p>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            'document.addEventListener("DOMContentLoaded", async function () {' +
            "\n" +
            "  try {" +
            "\n" +
            "    const result = await worldID.enable(); // <- Send 'result' to your backend or sm" +
            "\n" +
            "  } catch (failure) {" +
            "\n" +
            '    console.warn("World ID verification failed:", failure);' +
            "\n" +
            "    // Re-activate here so your end user can try again" +
            "\n" +
            "});"
          }
          language="javascript"
          theme="neutral"
          hideLineNumbers
        />
      </div>
    </>
  );

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
