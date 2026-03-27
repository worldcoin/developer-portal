import { EngineType } from "@/lib/types";
import { CodeDisplayComponent } from "./CodeDisplays";

type CodeBlockProps = {
  appId: string;
  action_identifier: string;
  engine?: string;
};

export const CodeBlock = (props: CodeBlockProps) => {
  const { appId, action_identifier, engine } = props;
  const presetFactory =
    engine === EngineType.OnChain ? "orbLegacy()" : "deviceLegacy()";

  const idKitWidgetCodeString = `
"use client";

import { useState } from "react";
import {
  IDKitRequestWidget,
  ${engine === EngineType.OnChain ? "orbLegacy" : "deviceLegacy"},
} from "@worldcoin/idkit";

const fetchRpContext = async () => {
  // Fetch a signed rp_context from your backend.
  const response = await fetch("/api/idkit/rp-context", {
    method: "POST",
    // ...
  });

  return response.json();
};

const verifyProof = async (result) => {
  const response = await fetch("/api/v4/verify/${appId}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    // Handle your error response here.
    throw new Error("Verification failed");
  }
};

export default function VerifyWithWorldID() {
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState(null);

  return (
    <>
      <button
        onClick={async () => {
          if (!rpContext) {
            setRpContext(await fetchRpContext());
          }
          setOpen(true);
        }}
      >
        Verify with World ID
      </button>

      {rpContext && (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id="${appId}"
          action="${action_identifier}"
          action_description="Describe the action the user is approving."
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={${presetFactory}}
          handleVerify={verifyProof}
          onSuccess={(result) => {
            console.log(result);
          }}
        />
      )}
    </>
  );
}
`.trim();

  const verifyProofCloudCodeString = `
// Note: This must be implemented server side or in a trusted route handler
const verifyProof = async (result) => {
  const response = await fetch("/api/v4/verify/${appId}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (response.ok) {
    return response.json();
  } else {
    const { code, detail } = await response.json();
    throw new Error(\`Error Code \${code}: \${detail}\`);
  }
};
// Result already includes action, nonce, protocol_version, and responses.`.trim();

  const verifyProofOnChainCodeString =
    "// example_verify.sol\n" +
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
    <div className="grid w-full max-w-full gap-y-5">
      <CodeDisplayComponent
        buttonText="Install IDKit"
        type="install"
        panelText="npm install @worldcoin/idkit"
      />
      <CodeDisplayComponent
        buttonText="Usage (React)"
        type="idkit"
        panelText={idKitWidgetCodeString}
      />
      <CodeDisplayComponent
        buttonText={`Verify Proof (${engine === EngineType.OnChain ? "On Chain" : "Cloud"})`}
        type="verify"
        panelText={
          engine === EngineType.OnChain
            ? verifyProofOnChainCodeString
            : verifyProofCloudCodeString
        }
      />
    </div>
  );
};
