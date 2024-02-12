import { canVerifyForAction } from "@/legacy/backend/utils";
import { uriHasJS, validateUrl } from "@/lib/utils";

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

  test("https", () => {
    expect(validateUrl(https)).toBeTruthy();
  });

  test("http", () => {
    expect(validateUrl(httpLocalhost)).toBeTruthy();
    expect(validateUrl(http)).toBeFalsy();
  });

  test("invalid", () => {
    expect(validateUrl(invalid)).toBeFalsy();
  });
});

describe("url js injection", () => {
  it("without inject", () => {
    expect(uriHasJS("http://test.com")).toBeFalsy();
  });

  it("with inject", () => {
    expect(uriHasJS("javascript:alert('test')")).toBeTruthy();
    expect(uriHasJS("javascript:;alert('test');")).toBeTruthy();
  });
});
