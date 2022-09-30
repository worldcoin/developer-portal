import { CodeBlock } from "common/CodeBlock";
import { Icon } from "common/Icon";
import { memo } from "react";
import { text } from "common/styles";

export const JSWidgetInstructions = memo(function JSWidgetInstructions({
  action_id,
}: {
  action_id: string;
}): JSX.Element {
  return (
    <>
      <div className="grid grid-cols-auto/1fr items-center gap-x-5">
        <Icon name="checkmark-selected" className="w-6 h-6 text-primary" />
        <span className="font-semibold">
          Integrate the JS widget on your frontend
        </span>
      </div>

      <CodeBlock
        code={
          "yarn add @worldcoin/id\n" + "# or\n" + "npm install @worldcoin/id"
        }
        language="bash"
        theme="neutral"
        caption="Install the widget"
        captionClassName={text.caption}
      />

      <CodeBlock
        code='<div id="world-id-container"></div>'
        language="html"
        theme="neutral"
        caption="Add an element to which to mount the widget"
        captionClassName={text.caption}
      />

      <CodeBlock
        code={`worldID.init("world-id-container", {
  enable_telemetry: true,
  action_id: "${action_id}",
  signal: "yourSignal" // <- Set an appropriate signal for each user
});`}
        language="js"
        theme="neutral"
        caption="Initialize the widget"
        captionClassName={text.caption}
      />

      <CodeBlock
        code={`document.addEventListener("DOMContentLoaded", async function () {
  try {
    const result = await worldID.enable(); // <- Send 'result' to your backend or smart contract
    console.log("World ID verified successfully!");
  } catch (failure) {
    console.warn("World ID verification failed:", failure);
    // Re-activate here so your end user can try again
  }
});`}
        language="js"
        theme="neutral"
        caption="Enable the widget"
        captionClassName={text.caption}
      />
    </>
  );
});
