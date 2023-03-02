import { memo } from "react";
import { CodeBlock } from "src/common/CodeBlock";

interface ApiVerificationInstructionsInterface {
  actionId: string;
}

export const ApiVerificationInstructions = memo(
  function ApiVerificationInstructions(
    props: ApiVerificationInstructionsInterface
  ) {
    return (
      <>
        <h2 className="font-sora font-semibold text-20 leading-6 text-primary">
          Verify the proof with the API
        </h2>

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          HTTP Request
        </h3>
        <CodeBlock
          className="mt-3"
          code={"POST https://developer.worldcoin.org/api/v1/verify"}
          language="text"
          theme="neutral"
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Headers
        </h3>
        <CodeBlock
          className="mt-3"
          code={`{
  "Content-Type": "application/json"
}`}
          language="json"
          theme="neutral"
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">Body</h3>
        <CodeBlock
          className="mt-3"
          code={`{
  "action_id": "wid_staging_442d023c609ffa14f658d3a36fb6597a",
  "signal": "<your_signal>",
  "proof": "<as_received_from_the_widget>",
  "nullifier_hash": "<as_received_from_the_widget>",
  "merkle_root": "<as_received_from_the_widget>"
}`}
          language="json"
          theme="neutral"
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Response
        </h3>
        <CodeBlock
          className="mt-3"
          code={`{
  "success": true,
  "nullifier_hash": "nil_c94ee7a8954a4f18effc179cfd76b992",
  "created_at": "2022-06-22T11:23:23.931Z"
}`}
          language="json"
          theme="neutral"
        />
      </>
    );
  }
);
