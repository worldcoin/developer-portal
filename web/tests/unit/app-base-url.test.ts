import {
  getAllowedAppBaseUrls,
  getPrimaryAppBaseUrl,
  siblingOrigin,
} from "@/lib/app-base-url";

// #region siblingOrigin
describe("siblingOrigin()", () => {
  it("maps a worldcoin.org host to its world.org sibling", () => {
    expect(siblingOrigin("https://developer.worldcoin.org")).toBe(
      "https://developer.world.org",
    );
  });

  it("maps a world.org host to its worldcoin.org sibling", () => {
    expect(siblingOrigin("https://developer.world.org")).toBe(
      "https://developer.worldcoin.org",
    );
  });

  it("preserves the port and protocol when mapping", () => {
    expect(siblingOrigin("http://staging-developer.worldcoin.org:3000")).toBe(
      "http://staging-developer.world.org:3000",
    );
  });

  it("maps by domain suffix, so internal *.worldcoin.org hosts also map", () => {
    expect(
      siblingOrigin("https://developer.staging-internal.worldcoin.org"),
    ).toBe("https://developer.staging-internal.world.org");
  });

  it("returns undefined for a host on neither domain", () => {
    expect(siblingOrigin("https://example.com")).toBeUndefined();
  });

  it("returns undefined for empty or non-URL input", () => {
    expect(siblingOrigin(undefined)).toBeUndefined();
    expect(siblingOrigin("")).toBeUndefined();
    expect(siblingOrigin("not a url")).toBeUndefined();
  });
});
// #endregion

// #region getPrimaryAppBaseUrl
describe("getPrimaryAppBaseUrl()", () => {
  const original = process.env.APP_BASE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = original;
  });

  it("returns the single configured origin", () => {
    process.env.APP_BASE_URL = "https://developer.worldcoin.org";
    expect(getPrimaryAppBaseUrl()).toBe("https://developer.worldcoin.org");
  });

  it("returns the first (trimmed) entry when comma-separated", () => {
    process.env.APP_BASE_URL =
      " https://developer.worldcoin.org , https://developer.world.org ";
    expect(getPrimaryAppBaseUrl()).toBe("https://developer.worldcoin.org");
  });

  it("returns undefined when APP_BASE_URL is unset", () => {
    delete process.env.APP_BASE_URL;
    expect(getPrimaryAppBaseUrl()).toBeUndefined();
  });
});
// #endregion

// #region getAllowedAppBaseUrls
describe("getAllowedAppBaseUrls()", () => {
  const original = process.env.APP_BASE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = original;
  });

  it("returns [canonical, sibling] for a dual-domain host", () => {
    process.env.APP_BASE_URL = "https://developer.worldcoin.org";
    expect(getAllowedAppBaseUrls()).toEqual([
      "https://developer.worldcoin.org",
      "https://developer.world.org",
    ]);
  });

  it("returns the single origin when the host has no dual-domain sibling", () => {
    process.env.APP_BASE_URL = "https://developer.example.com";
    expect(getAllowedAppBaseUrls()).toBe("https://developer.example.com");
  });

  it("returns undefined when APP_BASE_URL is unset", () => {
    delete process.env.APP_BASE_URL;
    expect(getAllowedAppBaseUrls()).toBeUndefined();
  });
});
// #endregion
