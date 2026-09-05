# World ID workflow

Retrieve the IDKit integration guide, the installed platform's SDK reference, credential/verification-flow guidance, and the migration guide only when migrating. Discover their current paths through the docs index or search.

## Decisions

- Identify whether this is proof of humanity, a one-time claim, or repeatable session/sign-in behavior. Nullifier handling must implement that application's semantics: a one-time claim rejects repeat redemption; repeatable sign-in must not permanently ban the returning user.
- Choose the intended trust boundary: backend verification or an on-chain verifier. Read the World Chain guide for an on-chain path. Do not require an extra backend verification call for a contract-verified proof unless the application needs both.
- Preserve legacy working behavior when the user requests a narrow fix. For an upgrade, map each removed field/callback using current migration docs and installed types.

## Implementation

Reuse the correct app/RP/action. Provision through world-portal only if configuration is missing and creation is in scope. A registration operation may still be pending; wait for confirmed registration before declaring the integration usable.

For flows requiring RP signing, keep it on a trusted backend. Use the Portal adapter's protected signing-key file or the existing approved secret manager. Configure a server-only runtime reference without reading the value into tool output. Bind the signed request to the intended action and application context.

Construct the client request from the version-matched SDK. Forward the complete result to the selected verifier without fabricating legacy fields. Validate expected action, signal/session context, and verifier response on the trusted side before protected effects. For claim flows, make nullifier uniqueness and the protected operation atomic; scope uniqueness to the intended action. For sessions, bind a fresh challenge to the pending login and consume that challenge once.

When using IDKit Core inside a Mini App, native transport can return an empty `connectorURI`. Do not require or render a QR code in that path. Always collect completion with the request's polling API; render a connect link/QR only when a URI exists. The React widget handles transport-specific presentation automatically. Read the current IDKit Mini Apps guide when the integration runs inside World App.

## Evidence

Exercise accepted proof, invalid/expired proof, mismatched context, and the appropriate replay behavior. Cover concurrent duplicate claims if claims are in scope. For contract verification, enforce replay protection before effects in contract state. Separately record sandbox/device proof completion and real verifier acceptance. Missing keys or a device means that layer is unverified, not that the mocked tests prove it.

Record the returned `protocol_version` and environment. A current 4.x SDK and `/api/v4/verify` endpoint can still complete a legacy 3.0 proof; that does not verify native 4.0 proof generation. Keep browser-simulator, native-simulator, sandbox, and physical-device results distinct.
