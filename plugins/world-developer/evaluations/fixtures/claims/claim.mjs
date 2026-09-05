// Application handler. The injected verifier is the external I/O boundary.
// This fixture is intentionally vulnerable to concurrent replay.
export function createClaimHandler(verify) {
  const redeemed = new Set();
  let grants = 0;
  return {
    async claim(result) {
      if (redeemed.has(result.nullifier)) return { status: 409 };
      const proof = await verify(result);
      if (!proof.valid) return { status: 400 };
      redeemed.add(result.nullifier);
      grants++;
      return { status: 200 };
    },
    count() { return grants; }
  };
}
