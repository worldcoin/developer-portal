# Mini App workflow

Retrieve version-matched installation, initialization, command, response, migration, and device-testing pages. For review preparation, retrieve current app-review and asset requirements as well.

## Integration

Inspect the installed MiniKit major version and any standalone-browser behavior. Confirm each command's API and response shape from current docs and package types; do not mix legacy command APIs with newer response handling. Initialize in the supported client lifecycle and handle availability, cancellation, errors, and browser fallback where the product supports it.

Check the installed package's peer dependencies when starting a bare bundler project. MiniKit 2.0.3 marks `viem` optional but imports its APIs when loading MiniKit; a build reporting missing viem exports needs a compatible peer installed, not mocked exports or native-command stubs.

Authenticate wallet sessions, verify payments, and check transaction results at the trusted boundary specified by each command's guide. A client success event is not sufficient proof of payment or identity. World ID integration follows the current IDKit path; load the World ID guide when proof verification is requested.

Inspect Portal app configuration before changing permissions or contract/token/domain lists. Preserve unrelated settings and approved metadata. Use the explicit `app_id` belonging to this project; do not substitute an RP ID.

## Review preparation

Use world-portal to inspect draft versus approved metadata, update the requested fields, and upload supplied assets through the upload tool. Validate supported formats, dimensions and limits against current requirements. Image generation is a separate optional capability, not a dependency of this plugin.

For development, use the Portal's draft preview link, including its `draft_id`. A public app link without the draft reference may be unavailable before approval. Confirm the target World App build can handle that link; a page opening in Safari does not establish native MiniKit behavior.

Check required metadata, public URLs, localization coverage, permissions, and required images. Re-read the resulting draft and present the precise app and submission state. Submit only when that actual submission is authorized; preparation alone does not authorize it. An API accepting a submission is not evidence of review approval.

## Evidence

Test command-specific success/failure behavior and supported browser fallback. Exercise the requested commands in World App through the current testing flow when a device and account are available. Record commands tested, client environment, and remaining manual device checks rather than claiming desktop tests cover native behavior.
