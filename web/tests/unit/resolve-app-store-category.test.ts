import { resolveAppStoreCategory } from "@/lib/categories";

describe("resolveAppStoreCategory", () => {
  describe("mini apps", () => {
    it("coerces the External category to Other", () => {
      expect(resolveAppStoreCategory("External", true)).toBe("Other");
    });

    it("coerces External case-insensitively and trims whitespace", () => {
      expect(resolveAppStoreCategory("external", true)).toBe("Other");
      expect(resolveAppStoreCategory("  EXTERNAL  ", true)).toBe("Other");
    });

    it("keeps a valid category", () => {
      expect(resolveAppStoreCategory("Social", true)).toBe("Social");
    });

    it("defaults a missing/empty category to Other", () => {
      expect(resolveAppStoreCategory(undefined, true)).toBe("Other");
      expect(resolveAppStoreCategory(null, true)).toBe("Other");
      expect(resolveAppStoreCategory("", true)).toBe("Other");
      expect(resolveAppStoreCategory("   ", true)).toBe("Other");
    });
  });

  describe("external apps", () => {
    it("allows the External category", () => {
      expect(resolveAppStoreCategory("External", false)).toBe("External");
    });

    it("keeps a valid category", () => {
      expect(resolveAppStoreCategory("Finance", false)).toBe("Finance");
    });

    it("defaults a missing/empty category to External", () => {
      expect(resolveAppStoreCategory(undefined, false)).toBe("External");
      expect(resolveAppStoreCategory("", false)).toBe("External");
    });
  });
});
