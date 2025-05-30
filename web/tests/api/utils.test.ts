import { canVerifyForAction } from "@/api/helpers/verify";
import { validateUrl } from "@/lib/utils";

describe("canVerifyForAction()", () => {
  test("can verify if it has not verified before", () => {
    expect(canVerifyForAction(undefined, 1)).toBe(true);
  });

  test("can verify if below max verifications", () => {
    expect(canVerifyForAction({ nullifier_hash: "1", uses: 1 }, 2)).toBe(true);
  });

  test("can verify if unlimited verifications", () => {
    expect(
      canVerifyForAction(
        { nullifier_hash: "nil_1", uses: Math.random() * 10 },
        0,
      ),
    ).toBe(true);
  });

  test("cannot verify if at max verifications", () => {
    expect(canVerifyForAction({ nullifier_hash: "1", uses: 2 }, 2)).toBe(false);
  });
});

describe("validateUrl()", () => {
  const invalid = "test.com";
  const https = "https://test.com/";
  const http = "http://test.com/";
  const httpLocalhost = "http://localhost:8000/";
  const isStaging = true;

  test("https", () => {
    expect(validateUrl(https, isStaging)).toBeTruthy();
  });

  test("http", () => {
    expect(validateUrl(httpLocalhost, isStaging)).toBeTruthy();
    expect(validateUrl(http, isStaging)).toBeFalsy();
  });

  test("invalid", () => {
    expect(validateUrl(invalid, isStaging)).toBeFalsy();
  });

  test("localhost prod", () => {
    expect(validateUrl(httpLocalhost, !isStaging)).toBeFalsy();
  });

  test("insecure schema", () => {
    expect(validateUrl("javascript:alert('test')", isStaging)).toBeFalsy();
    expect(validateUrl("jaVasCript:;alert('test');", isStaging)).toBeFalsy();
  });
});
