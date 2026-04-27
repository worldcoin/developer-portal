import { canVerifyForAction } from "@/api/helpers/verify";
import { isValidHostName, validateUri, validateUrl } from "@/lib/utils";

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

  describe("staging", () => {
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

    test("app schemes are rejected", () => {
      expect(validateUrl("worldapp://", isStaging)).toBeFalsy();
      expect(validateUrl("worldappstg://", isStaging)).toBeFalsy();
    });

    test("insecure schema", () => {
      expect(validateUrl("javascript:alert('test')", isStaging)).toBeFalsy();
      expect(validateUrl("jaVasCript:;alert('test');", isStaging)).toBeFalsy();
    });

    test("localhost ip is not allowed", () => {
      expect(validateUrl("http://127.0.0.1:3000", isStaging)).toBeFalsy();
    });

    test("schemeless is not allowed", () => {
      expect(validateUrl("example.com/path", isStaging)).toBeFalsy();
    });

    test("ftp is not allowed", () => {
      expect(validateUrl("ftp://example.com", isStaging)).toBeFalsy();
    });

    test("uppercase https is allowed", () => {
      expect(validateUrl("HTTPS://test.com/cb", isStaging)).toBeTruthy();
    });

    test("custom app scheme with path is rejected", () => {
      expect(validateUrl("worldapp://callback/path", isStaging)).toBeFalsy();
    });

    test("missing slashes after scheme is not allowed", () => {
      expect(validateUrl("worldapp:callback", isStaging)).toBeFalsy();
    });

    test("newline in https currently passes", () => {
      expect(
        validateUrl("https://test.com/\nalert(1)", isStaging),
      ).toBeTruthy();
    });
  });

  describe("production", () => {
    const isStaging = false;

    test("https", () => {
      expect(validateUrl(https, isStaging)).toBeTruthy();
    });

    test("http is rejected", () => {
      expect(validateUrl(httpLocalhost, isStaging)).toBeFalsy();
      expect(validateUrl(http, isStaging)).toBeFalsy();
    });

    test("app schemes are rejected", () => {
      expect(validateUrl("worldapp://", isStaging)).toBeFalsy();
      expect(validateUrl("worldappstg://", isStaging)).toBeFalsy();
    });

    test("invalid", () => {
      expect(validateUrl(invalid, isStaging)).toBeFalsy();
    });

    test("insecure schema", () => {
      expect(validateUrl("javascript:alert('test')", isStaging)).toBeFalsy();
      expect(validateUrl("jaVasCript:;alert('test');", isStaging)).toBeFalsy();
    });

    test("localhost ip is not allowed", () => {
      expect(validateUrl("http://127.0.0.1:3000", isStaging)).toBeFalsy();
    });

    test("schemeless is not allowed", () => {
      expect(validateUrl("example.com/path", isStaging)).toBeFalsy();
    });

    test("ftp is not allowed", () => {
      expect(validateUrl("ftp://example.com", isStaging)).toBeFalsy();
    });

    test("uppercase https is allowed", () => {
      expect(validateUrl("HTTPS://test.com/cb", isStaging)).toBeTruthy();
    });

    test("custom app scheme with path is rejected", () => {
      expect(validateUrl("worldapp://callback/path", isStaging)).toBeFalsy();
    });

    test("missing slashes after scheme is not allowed", () => {
      expect(validateUrl("worldapp:callback", isStaging)).toBeFalsy();
    });

    test("newline in https currently passes", () => {
      expect(
        validateUrl("https://test.com/\nalert(1)", isStaging),
      ).toBeTruthy();
    });
  });
});

describe("isValidHostName()", () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const ORIGINAL_APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
  const ORIGINAL_CDN = process.env.NEXT_PUBLIC_IMAGES_CDN_URL;

  const makeRequest = (host: string) => {
    const headers = new Headers();
    headers.set("host", host);
    return new Request("https://example.com", { headers });
  };

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: ORIGINAL_NODE_ENV,
    });
    process.env.NEXT_PUBLIC_APP_ENV = ORIGINAL_APP_ENV;
    process.env.NEXT_PUBLIC_IMAGES_CDN_URL = ORIGINAL_CDN;
  });

  describe("production", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production" });
      process.env.NEXT_PUBLIC_APP_ENV = "production";
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
    });

    test("accepts exact host match against full CDN URL", () => {
      expect(isValidHostName(makeRequest("cdn.example.com"))).toBe(true);
    });

    test("accepts exact host match against bare host CDN value", () => {
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "cdn.example.com";
      expect(isValidHostName(makeRequest("cdn.example.com"))).toBe(true);
    });

    test("rejects single-character host (substring bypass)", () => {
      // The previous implementation used cdnHost.includes(hostName), so any
      // substring of the CDN URL (e.g., "h", "cdn") would pass.
      expect(isValidHostName(makeRequest("h"))).toBe(false);
      expect(isValidHostName(makeRequest("cdn"))).toBe(false);
      expect(isValidHostName(makeRequest("example.com"))).toBe(false);
    });

    test("rejects attacker-controlled host that is a substring of CDN URL", () => {
      expect(isValidHostName(makeRequest("https"))).toBe(false);
      expect(isValidHostName(makeRequest(".com"))).toBe(false);
    });

    test("rejects host containing CDN as a substring", () => {
      expect(
        isValidHostName(makeRequest("evil.cdn.example.com.attacker.com")),
      ).toBe(false);
    });

    test("rejects when CDN env var is unset", () => {
      delete process.env.NEXT_PUBLIC_IMAGES_CDN_URL;
      expect(isValidHostName(makeRequest("cdn.example.com"))).toBe(false);
    });
  });

  describe("staging bypass", () => {
    test("accepts any host when NEXT_PUBLIC_APP_ENV=staging", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production" });
      process.env.NEXT_PUBLIC_APP_ENV = "staging";
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
      expect(isValidHostName(makeRequest("anything.com"))).toBe(true);
    });
  });

  describe("development bypass", () => {
    test("accepts any host when NODE_ENV=development", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development" });
      process.env.NEXT_PUBLIC_APP_ENV = "production";
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
      expect(isValidHostName(makeRequest("localhost:3000"))).toBe(true);
    });
  });
});

describe("validateUri()", () => {
  const invalid = "test.com";
  const https = "https://test.com/";
  const http = "http://test.com/";
  const httpLocalhost = "http://localhost:8000/";
  const custom = "worldapp://callback/path";
  const customRoot = "worldapp://";
  const customNoSlashes = "worldapp:";
  const blacklistedSchemes = [
    "intent://test",
    "market://details?id=com.example",
    "itms://itunes.apple.com/app/id123",
    "itmss://itunes.apple.com/app/id123",
    "itms-apps://itunes.apple.com/app/id123",
    "itms-services://?action=download-manifest&url=https://example.com/app.plist",
    "itms-beta://test",
  ];

  describe("staging", () => {
    const isStaging = true;

    test("https", () => {
      expect(validateUri(https, isStaging)).toBeTruthy();
    });

    test("http localhost allowed, remote http rejected", () => {
      expect(validateUri(httpLocalhost, isStaging)).toBeTruthy();
      expect(validateUri(http, isStaging)).toBeFalsy();
    });

    test("custom schemes allowed", () => {
      expect(validateUri(custom, isStaging)).toBeTruthy();
      expect(validateUri(customRoot, isStaging)).toBeTruthy();
      expect(validateUri(customNoSlashes, isStaging)).toBeTruthy();
      expect(validateUri("myapp+test-1://deep/link", isStaging)).toBeTruthy();
      expect(validateUri("myapp+test-1:", isStaging)).toBeTruthy();
    });

    test("blacklisted schemes are rejected", () => {
      blacklistedSchemes.forEach((uri) => {
        expect(validateUri(uri, isStaging)).toBeFalsy();
      });
    });

    test("schemeless is rejected", () => {
      expect(validateUri(invalid, isStaging)).toBeFalsy();
    });

    test("control chars are rejected", () => {
      expect(validateUri("https://test.com/\nalert(1)", isStaging)).toBeFalsy();
    });
  });

  describe("production", () => {
    const isStaging = false;

    test("https", () => {
      expect(validateUri(https, isStaging)).toBeTruthy();
    });

    test("http is rejected", () => {
      expect(validateUri(httpLocalhost, isStaging)).toBeFalsy();
      expect(validateUri(http, isStaging)).toBeFalsy();
    });

    test("custom schemes allowed", () => {
      expect(validateUri(custom, isStaging)).toBeTruthy();
      expect(validateUri(customRoot, isStaging)).toBeTruthy();
      expect(validateUri(customNoSlashes, isStaging)).toBeTruthy();
      expect(validateUri("myapp+test-1://deep/link", isStaging)).toBeTruthy();
      expect(validateUri("myapp+test-1:", isStaging)).toBeTruthy();
    });

    test("blacklisted schemes are rejected", () => {
      blacklistedSchemes.forEach((uri) => {
        expect(validateUri(uri, isStaging)).toBeFalsy();
      });
    });

    test("schemeless is rejected", () => {
      expect(validateUri(invalid, isStaging)).toBeFalsy();
    });

    test("control chars are rejected", () => {
      expect(validateUri("https://test.com/\nalert(1)", isStaging)).toBeFalsy();
    });
  });
});
