import { memo } from "react";
import { CodeBlock } from "src/components/CodeBlock";

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
        code={`yarn add @worldcoin/id
# or
npm install @worldcoin/id`}
        language="bash"
        theme="neutral"
      />

      <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
        Add an element to which to mount the widget
      </h3>
      <CodeBlock
        className="mt-3"
        code={'<div id="world-id-container"></div>'}
        language="bash"
        theme="neutral"
      />

      <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
        Initialize the widget
      </h3>
      <CodeBlock
        className="mt-3"
        code={`worldID.init("world-id-container", {
  enable_telemetry: true,
  action_id: "${props.actionId}",
  signal: "yourSignal" // <- Set an appropriate signal for each user
});`}
        language="javascript"
        theme="neutral"
      />

      <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
        Enable the widget
      </h3>
      <CodeBlock
        className="mt-3"
        code={`document.addEventListener("DOMContentLoaded", async function () {
  try {
    const result = await worldID.enable(); // <- Send 'result' to your backend or sm
  } catch (failure) {
    console.warn("World ID verification failed:", failure);
    // Re-activate here so your end user can try again
  }
});`}
        language="javascript"
        theme="neutral"
      />
    </>
  );
});
