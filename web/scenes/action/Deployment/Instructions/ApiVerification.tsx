import { memo } from "react";
import { CodeBlock } from "common/CodeBlock";

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
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={"POST https://developer.worldcoin.org/api/v1/verify"}
          language="text"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Headers
        </h3>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            "{" + "\n" + '  "Content-Type": "application/json"' + "\n" + "}"
          }
          language="json"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">Body</h3>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            "{" +
            "\n" +
            `  "action_id": "${props.actionId}",` +
            "\n" +
            '  "signal": "<your_signal>",' +
            "\n" +
            '  "proof": "<as_received_from_the_widget>",' +
            "\n" +
            '  "nullifier_hash": "<as_received_from_the_widget>",' +
            "\n" +
            '  "merkle_root": "<as_received_from_the_widget>"' +
            "\n" +
            "}"
          }
          language="json"
          theme="neutral"
          hideLineNumbers
        />

        <h3 className="mt-8 font-sora font-semibold text-16 leading-5">
          Response
        </h3>
        <CodeBlock
          className="mt-3"
          preTagClassName="p-4 border-neutral-muted bg-neutral-muted/30"
          code={
            "{" +
            "\n" +
            '  "success": true,' +
            "\n" +
            '  "nullifier_hash": "nil_c94ee7a8954a4f18effc179cfd76b992",' +
            "\n" +
            '  "created_at": "2022-06-22T11:23:23.931Z"' +
            "\n" +
            "}"
          }
          language="json"
          theme="neutral"
          hideLineNumbers
        />
      </>
    );
  }
);
