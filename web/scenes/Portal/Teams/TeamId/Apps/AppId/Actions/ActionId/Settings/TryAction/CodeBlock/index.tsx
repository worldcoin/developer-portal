import { EngineType } from "@/lib/types";
import { CodeDisplayComponent } from "./CodeDisplays";

type CodeBlockProps = {
  appId: string;
  action_identifier: string;
  engine?: string;
};

export const CodeBlock = (props: CodeBlockProps) => {
  const { appId, action_identifier, engine } = props;

  const idKitWidgetCodeString = `
// (If using Next.js - IDKitWidget must be run on client)
"use client"
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'

// TODO: Calls your implemented server route
const verifyProof = async (proof) => {
  throw new Error("TODO: verify proof server route")
};

// TODO: Functionality after verifying
const onSuccess = () => {
  console.log("Success")
};

// ...

<IDKitWidget
    app_id="${appId}"
    action="${action_identifier}"
    ${engine === EngineType.OnChain && "// On-chain only accepts Orb verifications"}
    verification_level={VerificationLevel.${engine === EngineType.OnChain ? "Orb" : "Device"}}
    handleVerify={verifyProof}
    onSuccess={onSuccess}>
    {({ open }) => (
      <button
        onClick={open}
      >
        Verify with World ID
      </button>
    )}
</IDKitWidget>
`.trim();

  const verifyProofCloudCodeString = `
// Note: This must be implemented server side
const verifyProof = async (proof) => {
  console.log('proof', proof);
  const response = await fetch(
    'https://developer.world.org/api/v2/verify/app_staging_129259332fd6f93d4fabaadcc5e4ff9d',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...proof, action: "test"}),
    }
  );
  if (response.ok) {
    const { verified } = await response.json();
    return verified;
  } else {
    const { code, detail } = await response.json();
    throw new Error(\`Error Code \${code}: \${detail}\`);
  }
};
// For a complete example see:
// https://github.com/worldcoin/world-id-cloud-template`.trim();

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
