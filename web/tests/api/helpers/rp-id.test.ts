import {
  candidateRpIdsForApp,
  isUnpredictableRpIdEnabled,
  resolveRpIdForNewRegistration,
} from "@/api/helpers/rp-id";
import { parseRpId } from "@/api/helpers/rp-utils";
import { generateRpIdString } from "@/lib/rp";

// #region Test Data
const appId = "app_00000000000000000000000000000001";
const otherAppId = "app_00000000000000000000000000000002";
const salt = "s".repeat(32);
const otherSalt = "t".repeat(32);
// #endregion

beforeEach(() => {
  delete process.env.ENABLE_UNPREDICTABLE_RP_ID;
  delete process.env.RP_ID_SALT;
  delete process.env.RP_ID_SALT_PREVIOUS;
});

// #region Flag off — legacy derivation is preserved
describe("resolveRpIdForNewRegistration [flag off]", () => {
  it("returns the legacy public derivation so existing behaviour is unchanged", () => {
    expect(resolveRpIdForNewRegistration(appId)).toBe(
      generateRpIdString(appId),
    );
    expect(isUnpredictableRpIdEnabled()).toBe(false);
  });

  it("ignores a configured salt until the flag is set", () => {
    process.env.RP_ID_SALT = salt;

    expect(resolveRpIdForNewRegistration(appId)).toBe(
      generateRpIdString(appId),
    );
  });

  it('treats any value other than "true" as off', () => {
    process.env.ENABLE_UNPREDICTABLE_RP_ID = "1";
    process.env.RP_ID_SALT = salt;

    expect(resolveRpIdForNewRegistration(appId)).toBe(
      generateRpIdString(appId),
    );
  });
});
// #endregion

// #region Flag on — unpredictable derivation
describe("resolveRpIdForNewRegistration [flag on]", () => {
  beforeEach(() => {
    process.env.ENABLE_UNPREDICTABLE_RP_ID = "true";
    process.env.RP_ID_SALT = salt;
  });

  it("no longer returns the value an attacker can compute from the app_id", () => {
    expect(resolveRpIdForNewRegistration(appId)).not.toBe(
      generateRpIdString(appId),
    );
  });

  it("keeps the rp_ + 16 lowercase hex shape that parseRpId and the route guards require", () => {
    const rpId = resolveRpIdForNewRegistration(appId);

    expect(rpId).toMatch(/^rp_[0-9a-f]{16}$/);
    // Must survive the round trip into the uint64 the registry indexes by.
    expect(parseRpId(rpId)).toBeLessThan(1n << 64n);
  });

  it("is deterministic, which is what lets the self-managed screen and register_rp agree", () => {
    expect(resolveRpIdForNewRegistration(appId)).toBe(
      resolveRpIdForNewRegistration(appId),
    );
  });

  it("gives different apps different ids", () => {
    expect(resolveRpIdForNewRegistration(appId)).not.toBe(
      resolveRpIdForNewRegistration(otherAppId),
    );
  });

  it("changes the id when the salt is rotated", () => {
    const before = resolveRpIdForNewRegistration(appId);
    process.env.RP_ID_SALT = otherSalt;

    expect(resolveRpIdForNewRegistration(appId)).not.toBe(before);
  });
});
// #endregion

// #region Candidate enumeration for the self-managed two-read gap
describe("candidateRpIdsForApp", () => {
  it("returns only the legacy id when no salt is configured", () => {
    expect(candidateRpIdsForApp(appId)).toEqual([generateRpIdString(appId)]);
  });

  it("puts the salted id first when the feature is on", () => {
    process.env.ENABLE_UNPREDICTABLE_RP_ID = "true";
    process.env.RP_ID_SALT = salt;

    const candidates = candidateRpIdsForApp(appId);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toBe(resolveRpIdForNewRegistration(appId));
    // The legacy id stays a candidate so a developer who registered before the
    // flag flipped on is still matched to their own on-chain registration.
    expect(candidates[1]).toBe(generateRpIdString(appId));
  });

  it("still probes the salted id first after a rollback", () => {
    // Flag off with the salt still present: the instructions screen may have
    // shown the salted id from a task that had the flag on. Probing the
    // guessable legacy id first would let a squatter's registration be adopted
    // as this app's RP, so the order must not follow the flag.
    process.env.RP_ID_SALT = salt;
    const legacy = generateRpIdString(appId);

    const candidates = candidateRpIdsForApp(appId);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).not.toBe(legacy);
    expect(candidates[1]).toBe(legacy);
  });

  it("ignores an unusably short salt rather than deriving with it", () => {
    process.env.RP_ID_SALT = "short";

    expect(candidateRpIdsForApp(appId)).toEqual([generateRpIdString(appId)]);
  });

  it("probes the previous salt during a rotation drain window", () => {
    // Rotation is the advertised remedy for a leaked salt, so performing it must
    // be safe: a developer shown an id derived from the outgoing salt has already
    // registered that id on-chain.
    process.env.ENABLE_UNPREDICTABLE_RP_ID = "true";
    process.env.RP_ID_SALT = salt;
    process.env.RP_ID_SALT_PREVIOUS = otherSalt;

    const candidates = candidateRpIdsForApp(appId);

    expect(candidates).toHaveLength(3);
    // Current salt wins; the guessable legacy id stays last regardless.
    expect(candidates[0]).toBe(resolveRpIdForNewRegistration(appId));
    expect(candidates[2]).toBe(generateRpIdString(appId));

    // The middle candidate is what the outgoing salt would have produced.
    process.env.RP_ID_SALT = otherSalt;
    expect(candidates[1]).toBe(resolveRpIdForNewRegistration(appId));
  });

  it("ignores an unusable previous salt", () => {
    process.env.RP_ID_SALT = salt;
    process.env.RP_ID_SALT_PREVIOUS = "short";

    expect(candidateRpIdsForApp(appId)).toHaveLength(2);
  });
});
// #endregion

// #region Fail closed on misconfiguration
describe("resolveRpIdForNewRegistration [misconfigured]", () => {
  beforeEach(() => {
    process.env.ENABLE_UNPREDICTABLE_RP_ID = "true";
  });

  it("throws rather than silently handing out a guessable id when the salt is missing", () => {
    expect(() => resolveRpIdForNewRegistration(appId)).toThrow(/RP_ID_SALT/);
  });

  it("throws when the salt is too short to be worth keying with", () => {
    process.env.RP_ID_SALT = "short";

    expect(() => resolveRpIdForNewRegistration(appId)).toThrow(/RP_ID_SALT/);
  });
});
// #endregion
