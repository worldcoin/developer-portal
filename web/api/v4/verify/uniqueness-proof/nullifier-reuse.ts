/**
 * Allow nullifier reuse in staging for all proofs, and for legacy v3 proofs
 * across environments.
 */
export const shouldAllowNullifierReuse = (
  protocolVersion: "3.0" | "4.0",
  environment: string,
): boolean => {
  const isStaging = environment === "staging";
  const isLegacyV3Proof = protocolVersion === "3.0";

  return isStaging || isLegacyV3Proof;
};
