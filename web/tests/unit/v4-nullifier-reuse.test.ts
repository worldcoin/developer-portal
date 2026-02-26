import { shouldAllowStagingNullifierReuse } from "@/api/v4/verify/uniqueness-proof/nullifier-reuse";

describe("shouldAllowStagingNullifierReuse", () => {
  it("allows nullifier reuse for v4 staging proofs", () => {
    expect(shouldAllowStagingNullifierReuse("4.0", "staging")).toBe(true);
  });

  it("does not allow nullifier reuse for v3 staging proofs", () => {
    expect(shouldAllowStagingNullifierReuse("3.0", "staging")).toBe(false);
  });

  it("does not allow nullifier reuse in production", () => {
    expect(shouldAllowStagingNullifierReuse("4.0", "production")).toBe(false);
    expect(shouldAllowStagingNullifierReuse("3.0", "production")).toBe(false);
  });
});

