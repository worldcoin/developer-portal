# World agent workflows

Choose AgentKit for human-backed agent access to x402 resources; choose World human-in-the-loop for authorizing a particular pending action. Agent registration is not authorization for every subsequent action.

Retrieve the relevant integration and SDK references, including supported x402 versions and networks. Inspect the actual client/server framework and persistence. Beta behavior is version-sensitive; use installed types and live docs.

For AgentKit, confirm registration/lookup networks independently of payment networks. Bind signature verification to the requested resource, atomically consume nonces, and persist usage counters for the selected access mode. Preserve the documented payment fallback. Test unregistered agents, invalid signatures, concurrent replay, exhausted access, and fallback when relevant. Confirm live registration through lookup before claiming success.

For human approval, persist the pending action, bind its exact arguments to the approval context, verify the result through the documented trusted flow, and resume once. Handle denial, expiry and cancellation. A successful UI callback is not authorization to execute. Load the World ID guide for proof/signing implementation and world-portal only when app configuration is required.
