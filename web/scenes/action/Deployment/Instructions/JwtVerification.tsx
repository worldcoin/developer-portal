import { memo } from "react";
import { CodeBlock } from "common/CodeBlock";
import { Link } from "common/components/Link";
import { Code } from "common/components/code";

interface JwtVerificationInstructionsInterface {
  actionId: string;
  hostedPageUrl: string;
}

export const JwtVerificationInstructions = memo(
  function JwtVerificationInstructions(
    props: JwtVerificationInstructionsInterface
  ) {
    return (
      <>
        <ol className="ml-4 list-decimal list-outside">
          <li className="mb-6">
            <div className="max-w-4xl mb-2">
              Add a button or redirect in your website or app to the following
              link.{" "}
              <b>
                Be sure to set the correct{" "}
                <Link
                  href="https://id.worldcoin.org/docs/about/glossary#signal"
                  external
                >
                  signal
                </Link>{" "}
                for each user.
              </b>
            </div>
            <CodeBlock
              code={props.hostedPageUrl || ""}
              language="text"
              theme="neutral"
            />
          </li>
          <li className="mb-6">
            <p className="max-w-4xl mb-2">
              Upon successful verification, the user will be redirected to your
              return URL with the following parameters, which you should obtain
              from the <b>query string</b>.
            </p>
            <table className="border-collapse border border-neutral-muted">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium border border-neutral-muted">
                    Parameter
                  </th>
                  <th className="px-3 py-2 font-medium border border-neutral-muted">
                    Description
                  </th>
                  <th className="px-3 py-2 font-medium border border-neutral-muted">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>success</Code>
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    Whether the verification was successful or not. Note this
                    returns a string value.{" "}
                    <b>Do not rely on this parameter alone (easy to spoof)!</b>
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>true</Code>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>verification_jwt</Code>
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    A JSON web token (JWT) containing the verification results,
                    see below on how to parse & validate.
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code title="eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c3JfMWQ4NTAxYzg0M2M5Zjg4NmRkZDIyMzZiZjZiNjc4OTQiLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsidXNlciJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtdXNlci1pZCI6InVzcl8xZDg1MDFjODQzYzlmODg2ZGRkMjIzNmJmNmI2Nzg5NCIsIngtaGFzdXJhLXRlYW0taWQiOiJ0ZWFtXzkyZWNlMWJjODg5MmIxOTQzZWY2MWUzNDVmM2ZjYmNjIn0sImlzcyI6Imh0dHBzOi8vZGV2ZWxvcGVyLndvcmxkY29pbi5vcmciLCJleHAiOjE2NTU3OTM4NDB9.dgPdJVrvnBRvpxWWmM7GnL01dJVtdhMba0yCJ9cLX0fopg7X1cV6Kvz42kuBJjUPvRa3il6RfyZUTL-LDEzaQw">
                      eyJhbGciOiJIUzUxMiJ9.W0ta9.dgPdJVrv
                    </Code>
                    <div>
                      <i>Cropped for display purposes</i>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>error_code</Code>
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    The code that specifies why the verification process was not
                    successful. Only present if verification errored. Please
                    review the error codes here.
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>already_verified</Code>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>nullifier_hash</Code>
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    The nullifier (unique verification ID) for this action. You
                    can use this to check the record with our API.
                  </td>
                  <td className="px-3 py-2 border border-neutral-muted">
                    <Code>0x1115a3febfe7a6d9dd9fd50ed2fb258e0</Code>
                    <div>
                      <i>Cropped for display purposes</i>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </li>
          <li className="mb-6">
            <div className="max-w-4xl mb-2">
              Verify the success response. Do not trust the{" "}
              <pre className="inline-block px-1 bg-neutral-muted rounded">
                success
              </pre>{" "}
              parameter alone, it&apos;s easy to spoof. To protect against this,
              we issue a special JWT for which you can verify the signature as
              shown below. If the signature matches, you can trust the response
              comes from us.
            </div>
            <ol className="ml-4 mt-4 list-[lower-alpha] list-outside">
              <li className="mb-6">
                <div className="max-w-4xl mb-2">
                  Install the following packages in your app
                </div>
                <CodeBlock
                  code={`yarn add jose
# or
npm install jose --save`}
                  language="sh"
                  theme="neutral"
                />
              </li>
              <li className="mb-6">
                <p className="max-w-4xl mb-2">
                  Parse the verification result JWT, verifying the signature.
                </p>
                <CodeBlock
                  code={`// Assumes JWT is in \`token\` var
import * as jose from 'jose';
const jsonKeys = await (await fetch('https://developer.worldcoin.org/api/v1/jwks')).json();
const kid = jose.decodeProtectedHeader(token).kid;
const jsonKey = jsonKeys.find((key) => key.kid === kid);
const publicKey =  await jose.importJWK(jsonKey, 'PS256');
const { payload } = await jose.jwtVerify(token, publicKey, { issuer: 'https://developer.worldcoin.org' });
if (payload.verified) {
  // user is a unique human, do your action here
  // you can use \`payload.nullifier_hash\` to get the anonymous ID for this user
}`}
                  language="javascript"
                  theme="neutral"
                />
              </li>
              <li className="mb-6">
                <div className="max-w-4xl mb-2">
                  The decoded token will contain the{" "}
                  <pre className="inline-block px-1 bg-neutral-muted rounded">
                    signal
                  </pre>{" "}
                  &{" "}
                  <pre className="inline-block px-1 bg-neutral-muted rounded">
                    nullifier_hash
                  </pre>{" "}
                  which you can use to match to a specific user on your side or
                  check for uniqueness (e.g. the{" "}
                  <pre className="inline-block px-1 bg-neutral-muted rounded">
                    signal
                  </pre>{" "}
                  can be your user ID or session ID).
                </div>
              </li>
            </ol>
          </li>
        </ol>
      </>
    );
  }
);
