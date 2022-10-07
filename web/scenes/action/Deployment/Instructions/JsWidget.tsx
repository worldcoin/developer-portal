import { memo } from "react";
import { CodeBlock } from "common/CodeBlock";

interface JsWidgetInstructionsInterface {
  actionId: string;
}

export const JsWidgetInstructions = memo(function JsWidgetInstructions(
  props: JsWidgetInstructionsInterface
) {
  return (
    <>
      <h2 className="font-sora font-semibold text-20 leading-6 text-primary">
        Integrate the JS widget on your frontend
      </h2>

      <h3 className="mt-6 font-sora font-semibold text-16 leading-5">
        Install the widget
      </h3>
      {/*<p className="text-14 text-neutral leading-4">*/}
      {/*  Instruction goes here, if needed.*/}
      {/*</p>*/}
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
      <CodeBlock
        className="mt-3"
        preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
        code={'<div id="world-id-container"></div>'}
        language="bash"
        theme="neutral"
        hideLineNumbers
      />

      <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
        Initialize the widget
      </h3>
      <CodeBlock
        className="mt-3"
        preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
        code={
          'worldID.init("world-id-container", {' +
          "\n" +
          "  enable_telemetry: true," +
          "\n" +
          '  action_id: "' +
          props.actionId +
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
          "  }" +
          "\n" +
          "});"
        }
        language="javascript"
        theme="neutral"
        hideLineNumbers
      />
    </>
  );
});
