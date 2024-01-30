import React from "react";
import { CodeDisplayComponent } from "./CodeDisplays";

type CodeBlockProps = {
  appId: string;
  action_identifier: string;
};
export const CodeBlock = (props: CodeBlockProps) => {
  const { appId, action_identifier } = props;
  const verifyProofCodeString =
    "// Note: API Call requires CORS to be enabled\n" +
    "const verifyProof = async (proof, action) => {\n" +
    "    console.log('proof', proof);\n" +
    "    const response = await fetch(\n" +
    `   'https://developer.worldcoin.org/api/v1/verify/${appId}',\n` +
    "      {\n" +
    "        method: 'POST',\n" +
    "        headers: {\n" +
    "          'Content-Type': 'application/json',\n" +
    "        },\n" +
    `        body: JSON.stringify({ ...proof, action: ${action_identifier}}),\n` +
    "      }\n" +
    "    );\n" +
    "    if (response.ok) {\n" +
    "      const { verified } = await response.json();\n" +
    "      return verified;\n" +
    "    }\n" +
    "\n" +
    "    return false;\n" +
    "  };";
  return (
    <div className="w-full max-w-full grid gap-y-5">
      <CodeDisplayComponent
        buttonText="Install ID Kit"
        panelText="npm install @worldcoin/idkit"
      />
      <CodeDisplayComponent
        buttonText="Usage"
        panelText={
          "import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'\n\n" +
          "<IDKitWidget\n" +
          `    app_id="${appId}"\n` +
          `    action="${action_identifier}"\n` +
          `    onSuccess={() => console.log("Success")}\n` +
          `    handleVerify={verifyProof} // Make sure to copy the callback below\n` +
          "    verification_level={VerificationLevel.Device} // Choose between Orb or Device\n" +
          ">\n" +
          "    {({ open }) => <button onClick={open}>Verify with World ID</button>}\n" +
          "</IDKitWidget>"
        }
      />
      <CodeDisplayComponent
        buttonText="Verify Proof"
        panelText={verifyProofCodeString}
      />
    </div>
  );
};
