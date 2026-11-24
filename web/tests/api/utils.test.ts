import { canVerifyForAction } from "@/api/helpers/verify";
import {
  isValidHostName,
  validateUri,
  validateUrl,
  validateWebhookUrl,
} from "@/lib/utils";

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

    test("accepts request without port when CDN env has explicit port", () => {
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com:443";
      expect(isValidHostName(makeRequest("cdn.example.com"))).toBe(true);
    });

    test("accepts request with port when CDN env has no port", () => {
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "https://cdn.example.com";
      expect(isValidHostName(makeRequest("cdn.example.com:443"))).toBe(true);
    });

    test("accepts bare-host CDN env with explicit port", () => {
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "cdn.example.com:443";
      expect(isValidHostName(makeRequest("cdn.example.com"))).toBe(true);
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

describe("validateWebhookUrl()", () => {
  describe("accepts public HTTPS targets", () => {
    test.each([
      "https://collector.example.com/ce25-c014",
      "https://sub.domain.example.com:8443/path?x=1",
      "https://8.8.8.8/hook",
      "https://11.0.0.1/hook", // just outside 10.0.0.0/8
      "https://172.15.0.1/hook", // just below 172.16.0.0/12
      "https://172.32.0.1/hook", // just above 172.16.0.0/12
      "https://192.169.0.1/hook", // just outside 192.168.0.0/16
      "https://100.63.255.255/hook", // just below CGNAT 100.64.0.0/10
      "https://100.128.0.1/hook", // just above CGNAT 100.64.0.0/10
      "https://169.253.255.255/hook", // just below link-local 169.254.0.0/16
      "https://[2606:4700:4700::1111]/hook", // public IPv6
      "https://collector.example.com./hook", // trailing root dot, public FQDN
      "https://223.255.255.255/hook", // just below multicast 224.0.0.0/4
      "https://198.17.255.255/hook", // just below benchmarking 198.18.0.0/15
      "https://198.20.0.1/hook", // just above benchmarking 198.18.0.0/15
    ])("accepts %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(true);
    });
  });

  describe("rejects non-HTTPS and malformed URLs", () => {
    test.each([
      "",
      "   ",
      "http://collector.example.com/hook",
      "http://localhost:8000/hook",
      "ftp://example.com/hook",
      "worldapp://callback",
      "example.com/path",
      "https://",
      "not a url",
    ])("rejects %j", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects localhost by name", () => {
    test.each([
      "https://localhost/hook",
      "https://localhost:8443/hook",
      "https://foo.localhost/hook",
      "https://api.internal.localhost/hook",
      "https://localhost./hook", // root-qualified (trailing dot)
      "https://foo.localhost./hook", // root-qualified subdomain
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects loopback, private, link-local, and metadata IPv4", () => {
    test.each([
      "https://127.0.0.1/hook", // loopback
      "https://127.1.2.3:8443/hook", // loopback range
      "https://0.0.0.0/hook", // this-host
      "https://10.0.0.1/hook", // private
      "https://10.255.255.255/hook",
      "https://172.16.0.1/hook", // private
      "https://172.31.255.255/hook",
      "https://192.168.1.1/hook", // private
      "https://169.254.169.254/latest/meta-data/", // cloud metadata
      "https://169.254.0.1/hook", // link-local
      "https://100.64.0.1/hook", // CGNAT
      "https://100.127.255.255/hook",
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects multicast, reserved, and special-purpose IPv4", () => {
    test.each([
      "https://192.0.0.1/hook", // 192.0.0.0/24 protocol assignments
      "https://192.0.2.1/hook", // TEST-NET-1
      "https://192.88.99.1/hook", // 6to4 relay anycast
      "https://198.18.0.1/hook", // benchmarking
      "https://198.19.255.255/hook", // benchmarking (top of /15)
      "https://198.51.100.1/hook", // TEST-NET-2
      "https://203.0.113.1/hook", // TEST-NET-3
      "https://224.0.0.1/hook", // multicast
      "https://239.255.255.250/hook", // SSDP multicast
      "https://240.0.0.1/hook", // reserved
      "https://255.255.255.255/hook", // limited broadcast
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects alternate IPv4 encodings resolving to blocked ranges", () => {
    test.each([
      "https://0x7f000001/hook", // 127.0.0.1 (hex)
      "https://2130706433/hook", // 127.0.0.1 (decimal)
      "https://017700000001/hook", // 127.0.0.1 (octal)
      "https://127.1/hook", // 127.0.0.1 (shorthand)
      "https://0/hook", // 0.0.0.0 (bare integer)
      "https://0300.0250.0.1/hook", // 192.168.0.1 (octal)
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects credentials-obscured internal hosts", () => {
    test.each([
      "https://user:pass@127.0.0.1/hook",
      "https://example.com@169.254.169.254/hook",
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects loopback, unspecified, ULA, and link-local IPv6", () => {
    test.each([
      "https://[::1]/hook", // loopback
      "https://[::]/hook", // unspecified
      "https://[0::0]/hook", // unspecified
      "https://[fd00::1]/hook", // unique-local
      "https://[fc00::1]/hook",
      "https://[fe80::1]/hook", // link-local
      "https://[febf::1]/hook",
      "https://[fec0::1]/hook", // deprecated site-local
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects IPv4-mapped IPv6 pointing at blocked ranges", () => {
    test.each([
      "https://[::ffff:127.0.0.1]/hook",
      "https://[::ffff:169.254.169.254]/hook",
      "https://[::ffff:10.0.0.1]/hook",
      "https://[::ffff:7f00:1]/hook", // hex form of 127.0.0.1
      "https://[::ffff:a9fe:a9fe]/hook", // hex form of 169.254.169.254
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects IPv4-compatible and other ::/96 IPv6 literals", () => {
    test.each([
      "https://[::127.0.0.1]/hook", // canonicalizes to ::7f00:1
      "https://[::7f00:1]/hook", // hex form of ::127.0.0.1
      "https://[::a9fe:a9fe]/hook", // ::169.254.169.254
      "https://[::8.8.8.8]/hook", // deprecated IPv4-compatible, not publicly routable
    ])("rejects %s", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
    });
  });

  describe("rejects URLs containing control characters", () => {
    const LF = String.fromCharCode(0x0a);
    const CR = String.fromCharCode(0x0d);
    const TAB = String.fromCharCode(0x09);
    const NUL = String.fromCharCode(0x00);

    test.each([
      "https://example.com/" + LF + "Host: evil",
      "https://example.com/" + CR + LF + "x",
      "https://example.com/" + TAB + "x",
      "https://example.com/" + NUL,
      "https://collector.example.com/hook" + LF, // trailing (trim() would strip)
      LF + "https://collector.example.com/hook", // leading (trim() would strip)
      "https://collector.example.com/hook" + TAB, // trailing tab
      CR + "https://collector.example.com/hook", // leading CR
    ])("rejects url with an embedded control character", (url) => {
      expect(validateWebhookUrl(url)).toBe(false);
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
