/** Maps Verifier contract revert reasons to user-friendly error codes. */
export const VERIFIER_ERROR_MAP: Record<
  string,
  { code: string; detail: string }
> = {
  OutdatedNullifier: {
    code: "outdated_nullifier",
    detail: "The proof has expired. Please generate a new proof.",
  },
  NullifierFromFuture: {
    code: "nullifier_from_future",
    detail: "The proof timestamp is in the future.",
  },
  InvalidMerkleRoot: {
    code: "invalid_root",
    detail: "The authenticator root is not valid.",
  },
  UnregisteredIssuerSchemaId: {
    code: "invalid_credential_issuer",
    detail: "The credential issuer is not registered.",
  },
  ProofInvalid: {
    code: "invalid_proof",
    detail: "The proof is invalid.",
  },
  PublicInputNotInField: {
    code: "invalid_public_input",
    detail: "A public input value is out of range.",
  },
};
