import { readFileSync } from "fs";
import path from "path";

const migrationDirectory = path.join(
  __dirname,
  "../../../hasura/migrations/default/1789668000000_recover_reviewer_claims",
);
const up = readFileSync(path.join(migrationDirectory, "up.sql"), "utf8");
const down = readFileSync(path.join(migrationDirectory, "down.sql"), "utf8");

describe("reviewer claim recovery", () => {
  it("rotates only the authenticated owner's live claim", () => {
    expect(up).toContain("recovering_existing_claim boolean");
    expect(up).toContain(
      "candidate.claimed_by_subject IS DISTINCT FROM p_actor_subject",
    );
    expect(up).toContain("claim_token = gen_random_uuid()");
    expect(up).toContain(
      "'recovered_existing_claim', recovering_existing_claim",
    );
    expect(up).not.toContain("candidate.claim_token',");
  });

  it("keeps the rollback implementation exclusive", () => {
    expect(down).toContain("candidate.claim_token IS NOT NULL");
    expect(down).toContain("candidate.claim_expires_at > now()");
    expect(down).not.toContain("recovering_existing_claim");
  });
});
