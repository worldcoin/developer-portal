# v1 validation

## Completed before repository packaging

The local implementation passed 28 adapter/secret-storage tests, five credential-setup tests, and 77 Portal handler/documentation tests. A five-scenario model smoke evaluation covered documentation-only access, read-only diagnosis, concurrent claims, review readiness and interrupted registration. The plugin passed five scenarios; the two-MCP baseline passed four. This small sample is not a statistical performance claim.

A live test used a dedicated credential and test resources to confirm:

- Authenticated Portal access and matching live schemas.
- Creation of World ID and Mini App records and production/staging RP registration.
- Actual generated-key handoff, owner-only file permissions, and signer-address matching.
- A legacy staging proof accepted by the real verifier; an invalid proof rejected with HTTP 400; process-local claim replay rejected with HTTP 409.
- A physical iPhone running World App successfully initialized MiniKit and returned a native permissions result.
- A physical-phone production World ID **4.0** proof was accepted with HTTP 200.

The live test caught an empty-QR bug in the throwaway test page: native IDKit Core requests have no connector URI. The page and workflow guide were corrected, two transport-branch regression tests passed, and the phone retry succeeded. The test also identified a MiniKit optional-peer dependency issue and the need to use draft preview links.

Personal identifiers, credentials, device traces, local paths and raw transcripts are intentionally not included in this release.

## Release checks

CI validates the distributable package on Node 20/22, runs its Node and Python tests, checks formatting, verifies the generated contract and embedded guide, and exercises a clean extracted archive without Portal build dependencies. New tests cover synthetic-payload preservation, secret redaction, unsupported-server fallback, invalid outcomes, direct-result semantics and uncertain-operation details.

Synthetic test-verification support depends on server deployment. The existing live proof checks do not establish that this newer optional tool is deployed. The synthetic feature's backend behavior is covered by its infrastructure/interface PRs; the plugin tests its boundary behavior with fixtures.

## Limits

- The internal simulator's sandbox/native-4.0 handoff did not complete. This is separate from the successful physical-phone production flow.
- The throwaway test app used a process-local replay guard; it did not prove database transaction durability or multi-instance claim safety.
- Synthetic verification does not test client signing, credential issuance, cryptographic proof generation, custom signals or session proofs.
- General World Chain deployments and agent approval workflows were not live-tested. Their guides are not a claim of end-to-end coverage.
- No app-store review submission or OpenAI directory publication was performed.
