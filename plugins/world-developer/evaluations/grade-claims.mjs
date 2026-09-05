// Independent post-run tests. Kept outside the agent's editable fixture.
import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
const { createClaimHandler } = await import(
  pathToFileURL(join(process.env.WORLD_EVAL_PROJECT, "claim.mjs"))
);
test("sequential and concurrent verified replay grants exactly once", async () => {
  const handler = createClaimHandler(async (result) => {
    await new Promise((r) => setTimeout(r, 5));
    return { valid: true, nullifier: result.nullifier };
  });
  const responses = await Promise.all([
    handler.claim({ nullifier: "same" }),
    handler.claim({ nullifier: "same" }),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await handler.claim({ nullifier: "same" })).status, 409);
  assert.equal(handler.count(), 1);
});
test("invalid proof cannot consume a claim", async () => {
  let valid = false;
  const handler = createClaimHandler(async (result) => ({
    valid,
    nullifier: result.nullifier,
  }));
  assert.equal((await handler.claim({ nullifier: "human-a" })).status, 400);
  valid = true;
  assert.equal((await handler.claim({ nullifier: "human-a" })).status, 200);
});
test("different verified people can claim independently", async () => {
  const handler = createClaimHandler(async (result) => ({
    valid: true,
    nullifier: result.nullifier,
  }));
  assert.equal((await handler.claim({ nullifier: "human-a" })).status, 200);
  assert.equal((await handler.claim({ nullifier: "human-b" })).status, 200);
  assert.equal(handler.count(), 2);
});
