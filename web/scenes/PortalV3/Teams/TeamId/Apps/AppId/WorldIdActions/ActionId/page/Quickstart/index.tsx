import { CopyButton } from "@/components/CopyButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

/**
 * Builds the copy-paste-true code snippets for the embedded quickstart.
 *
 * Frontend snippet: `handleVerify` receives IDKit's `IDKitResult`, which is the
 * exact request body shape expected by `POST /api/v4/verify/:app_id` (see
 * `web/api/v4/verify/request-schema.ts` — `protocol_version`, `nonce`, `action`,
 * `responses`). This mirrors `submitKioskProof` in
 * `web/scenes/.../Components/Kiosk/useLegacyKioskRequest.ts`, which posts
 * `JSON.stringify(result)` verbatim with no reshaping.
 *
 * Backend snippet: forwards that same body to
 * `https://developer.worldcoin.org/api/v4/verify/{appId}` unmodified (the
 * `action` field is already present inside `proof`); a non-200 response means
 * the proof was rejected (validation failure or verification failure both
 * return non-2xx per `web/api/v4/verify/index.ts` and
 * `uniqueness-proof/handler.ts`).
 */
export const buildSnippets = (appId: string, action: string) => {
  const install = "npm install @worldcoin/idkit";

  const frontend = `import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";

<IDKitWidget
  app_id="${appId}"
  action="${action}"
  verification_level={VerificationLevel.Orb}
  handleVerify={(proof) => fetch("/api/verify-world-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proof),
  }).then((r) => { if (!r.ok) throw new Error("verification failed"); })}
  onSuccess={() => console.log("verified human ✓")}
>
  {({ open }) => <button onClick={open}>Verify with World ID</button>}
</IDKitWidget>`;

  const backend = `// app/api/verify-world-id/route.ts
export async function POST(req: Request) {
  const proof = await req.json();

  const response = await fetch(
    "https://developer.worldcoin.org/api/v4/verify/${appId}",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // proof already contains "action": "${action}"
      body: JSON.stringify(proof),
    },
  );

  if (!response.ok) {
    // Non-200 means the proof was rejected.
    return new Response("Verification failed", { status: 400 });
  }

  return new Response(null, { status: 200 });
}`;

  return { install, frontend, backend };
};

const CodeBlock = (props: {
  testId: string;
  fieldName: string;
  code: string;
}) => {
  const { testId, fieldName, code } = props;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-12 border border-grey-200 bg-grey-50 p-3">
      <pre
        data-testid={testId}
        className="min-w-0 overflow-x-auto whitespace-pre font-ibm text-xs leading-5 text-grey-900"
      >
        <code>{code}</code>
      </pre>
      <span data-testid="quickstart-copy-button">
        <CopyButton fieldName={fieldName} fieldValue={code} />
      </span>
    </div>
  );
};

const Step = (props: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => {
  const { number, title, children } = props;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
      <div className="grid size-6 place-items-center rounded-full bg-grey-900 text-white">
        <Typography variant={TYPOGRAPHY.M5}>{number}</Typography>
      </div>
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.M4} className="text-grey-700">
          {title}
        </Typography>
        {children}
      </div>
    </div>
  );
};

export const Quickstart = (props: {
  appId: string;
  action: string;
  isStaging: boolean;
}) => {
  const { appId, action, isStaging } = props;
  const snippets = buildSnippets(appId, action);

  return (
    <div className="grid gap-y-6 rounded-16 border border-grey-200 p-5">
      <Typography variant={TYPOGRAPHY.H7}>Quickstart</Typography>

      <Step number={1} title="Install IDKit">
        <CodeBlock
          testId="quickstart-snippet-install"
          fieldName="Install command"
          code={snippets.install}
        />
      </Step>

      <Step number={2} title="Add the widget to your frontend">
        <CodeBlock
          testId="quickstart-snippet-frontend"
          fieldName="Frontend snippet"
          code={snippets.frontend}
        />
      </Step>

      <Step number={3} title="Verify the proof on your backend">
        <CodeBlock
          testId="quickstart-snippet-backend"
          fieldName="Backend snippet"
          code={snippets.backend}
        />
      </Step>

      {isStaging && (
        <div className="rounded-12 border border-grey-200 bg-grey-50 p-3">
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Staging app — produce a test proof with the{" "}
            <a
              href="https://simulator.worldcoin.org/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              World ID Simulator
            </a>
            .
          </Typography>
        </div>
      )}
    </div>
  );
};
