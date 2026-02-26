/**
 * Staging nullifier reuse is only allowed for protocol v4.
 * Legacy v3 uniqueness proofs must remain strictly one-time-use.
 */
export const shouldAllowStagingNullifierReuse = (
  protocolVersion: "3.0" | "4.0",
  environment: string,
): boolean => protocolVersion === "4.0" && environment === "staging";

