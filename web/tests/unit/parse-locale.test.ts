import { parseLocale } from "@/lib/languages";

describe("parseLocale", () => {
  it("should parse locale", () => {
    expect(parseLocale("en-US")).toBe("en");
  });

  it("should parse zh-TW and zh_TW and zh-Hant-TW", () => {
    expect(parseLocale("zh-TW")).toBe("zh_TW");
    expect(parseLocale("zh_TW")).toBe("zh_TW");
    expect(parseLocale("zh-Hant-TW")).toBe("zh_TW");
  });

  it("should parse es-419 and es_419", () => {
    expect(parseLocale("es-419")).toBe("es_419");
    expect(parseLocale("es_419")).toBe("es_419");
  });

  it("should parse zh-CN and zh_CN", () => {
    expect(parseLocale("zh-CN")).toBe("zh_CN");
    expect(parseLocale("zh_CN")).toBe("zh_CN");
  });

  it("should parse es", () => {
    expect(parseLocale("es")).toBe("es");
  });
});
