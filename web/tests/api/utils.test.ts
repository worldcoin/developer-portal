import { canVerifyForAction } from "api-helpers/jwts";

describe("canVerifyForAction()", () => {
  test("can verify if it has not verified before", () => {
    expect(canVerifyForAction([], 1)).toBe(true);
  });

  test("can verify if below max verifications", () => {
    expect(canVerifyForAction([{ nullifier_hash: "1" }], 2)).toBe(true);
  });

  test("can verify if unlimited verifications", () => {
    const nullifiers = [];
    for (let i = 0; i < Math.random() * 10; i++) {
      nullifiers.push({ nullifier_hash: "nil_1" });
    }
    expect(canVerifyForAction(nullifiers, 0)).toBe(true);
  });

  test("cannot verify if at max verifications", () => {
    expect(
      canVerifyForAction([{ nullifier_hash: "1" }, { nullifier_hash: "2" }], 2)
    ).toBe(false);
  });
});
