import test from 'node:test';
import assert from 'node:assert/strict';
import { createClaimHandler } from './claim.mjs';
test('accepts one verified claim', async () => {
  const handler = createClaimHandler(async result => ({ valid: true, nullifier: result.nullifier }));
  assert.equal((await handler.claim({ nullifier: 'human-a' })).status, 200);
  assert.equal(handler.count(), 1);
});
