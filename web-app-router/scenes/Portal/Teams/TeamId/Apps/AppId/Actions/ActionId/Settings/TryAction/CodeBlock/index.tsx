import React from "react";
import { DisclosureComponent } from "./Disclosure";

type CodeBlockProps = {
  appId: string;
  action_identifier: string;
};
export const CodeBlock = (props: CodeBlockProps) => {
  const { appId, action_identifier } = props;
  return (
    <div className="w-full max-w-full grid gap-y-5">
      <DisclosureComponent
        buttonText="Install ID Kit"
        panelText="npm install @worldcoin/idkit"
      />
      <DisclosureComponent
        buttonText="Usage"
        panelText={
          "import { IDKitWidget } from '@worldcoin/idkit'\n\n" +
          "<IDKitWidget\n" +
          `    app_id="${appId}"\n` +
          `    action="${action_identifier}"\n` +
          "    onSuccess={onSuccess}\n" +
          "    handleVerify={handleVerify}\n" +
          "    verification_level={VerificationLevel.Device}\n" +
          ">\n" +
          "    {({ open }) => <button onClick={open}>Verify with World ID</button>}\n" +
          "</IDKitWidget>"
        }
      />
    </div>
  );
};
