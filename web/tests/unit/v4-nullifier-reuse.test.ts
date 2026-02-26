import { shouldAllowNullifierReuse } from "@/api/v4/verify/uniqueness-proof/nullifier-reuse";

describe("shouldAllowNullifierReuse", () => {
  it("allows nullifier reuse for v4 staging proofs", () => {
    expect(shouldAllowNullifierReuse("4.0", "staging")).toBe(true);
  });

  it("allows nullifier reuse for v3 staging proofs", () => {
    expect(shouldAllowNullifierReuse("3.0", "staging")).toBe(true);
  });

  it("allows nullifier reuse for v3 production proofs", () => {
    expect(shouldAllowNullifierReuse("3.0", "production")).toBe(true);
  });

  it("does not allow nullifier reuse for v4 production proofs", () => {
    expect(shouldAllowNullifierReuse("4.0", "production")).toBe(false);
  });
});
