import { parseTheme } from "@/lib/portal-v3/theme";

describe("parseTheme", () => {
  it("returns dark only for the exact 'dark' value", () => {
    expect(parseTheme("dark")).toBe("dark");
  });

  it("defaults to light for light / missing / garbage", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme(undefined)).toBe("light");
    expect(parseTheme("DARK")).toBe("light");
    expect(parseTheme("")).toBe("light");
  });
});
