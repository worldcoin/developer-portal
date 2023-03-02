import { validateUrl } from "src/lib/utils";

describe("validate url", () => {
  const invalid = "test.com";
  const https = "https://test.com/";
  const http = "http://test.com/";
  test("https", () => {
    expect(validateUrl(https)).toBeTruthy();
  });
  test("http", () => {
    expect(validateUrl(http, false)).toBeTruthy();
    expect(validateUrl(http, true)).toBeFalsy();
  });
  test("invalid", () => {
    expect(validateUrl(invalid)).toBeFalsy();
  });
});
