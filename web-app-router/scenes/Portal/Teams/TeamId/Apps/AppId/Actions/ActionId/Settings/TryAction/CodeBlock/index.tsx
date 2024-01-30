import React from "react";
import { CodeDisplayComponent } from "./CodeDisplays";
import { EngineType } from "@/lib/types";

type CodeBlockProps = {
  appId: string;
  action_identifier: string;
  engine?: EngineType;
};

export const CodeBlock = (props: CodeBlockProps) => {
  const { appId, action_identifier, engine } = props;

  const verifyProofCloudCodeString =
    "// Note: Proof must be verified server side\n" +
    "// For an end to end example see: https://github.com/worldcoin/world-id-cloud-template \n" +
    "const verifyProof = async (proof) => {\n" +
    "    console.log('proof', proof);\n" +
    "    const response = await fetch(\n" +
    `      'https://developer.worldcoin.org/api/v1/verify/${appId}',\n` +
    "      {\n" +
    "        method: 'POST',\n" +
    "        headers: {\n" +
    "          'Content-Type': 'application/json',\n" +
    "        },\n" +
    `        body: JSON.stringify({ ...proof, action: "${action_identifier}"}),\n` +
    "      }\n" +
    "    );\n" +
    "    if (response.ok) {\n" +
    "      const { verified } = await response.json();\n" +
    "      return verified;\n" +
    "    } else {\n" +
    "      const { code, detail } = await response.json();\n" +
    "      return new Error(`Error Code ${code}: ${detail}`);\n" +
    "    }" +
    "\n" +
    `    return new Error("Proof did not verify")\n` +
    "  };";

  const verifyProofOnChainCodeString =
    "// TODO: Constructor...\n\n" +
    "function _exampleVerifyAndExecute(\n" +
    "    address signal,\n" +
    "    uint256 root,\n" +
    "    uint256 nullifierHash,\n" +
    "    uint256[8] calldata proof\n" +
    ") public {\n" +
    "    // Check Uniqueness\n" +
    "    if (nullifierHashes[nullifierHash]) revert InvalidNullifier();\n" +
    "\n" +
    "    // Verify User has a valid World ID\n" +
    "    worldId.verifyProof(\n" +
    "        root,\n" +
    '        groupId, // set to "1" in the constructor\n' +
    "        abi.encodePacked(signal).hashToField(),\n" +
    "        nullifierHash,\n" +
    "        externalNullifierHash,\n" +
    "        proof\n" +
    "    );\n" +
    "\n" +
    "    nullifierHashes[nullifierHash] = true;\n" +
    "\n" +
    "    // Finally, execute your logic here, knowing the user is verified\n" +
    "}\n\n" +
    "Note: This is just an example. Full implementation requires \n" +
    "deploying a smart contract and making a transaction\n" +
    "\nSee an end to end example:\n" +
    "https://github.com/worldcoin/world-id-onchain-template";
  return (
    <div className="w-full max-w-full grid gap-y-5">
      <CodeDisplayComponent
        buttonText="Install ID Kit"
        panelText="npm install @worldcoin/idkit"
      />
      <CodeDisplayComponent
        buttonText="Usage"
        panelText={
          `"use client" // (Next.JS only - IDKitWidget must be run on client)\n` +
          "import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'\n\n" +
          `const verifyProof = async (proof) => throw new Error("TODO: verify proof server route")\n\n` +
          "<IDKitWidget\n" +
          `    app_id="${appId}"\n` +
          `    action="${action_identifier}"\n` +
          `    onSuccess={() => console.log("Success")}\n` +
          `    handleVerify={verifyProof} // Make sure to use the correct callback\n` +
          "    verification_level={VerificationLevel.Device} // Choose between Orb or Device\n" +
          ">\n" +
          "    {({ open }) => <button onClick={open}>Verify with World ID</button>}\n" +
          "</IDKitWidget>"
        }
      />
      <CodeDisplayComponent
        buttonText={`Verify Proof (${engine === EngineType.OnChain ? "On Chain" : "Cloud"})`}
        panelText={
          engine === EngineType.OnChain
            ? verifyProofOnChainCodeString
            : verifyProofCloudCodeString
        }
      />
    </div>
  );
};
