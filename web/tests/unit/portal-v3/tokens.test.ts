import { readFileSync } from "fs";
import { join } from "path";

// web/ root: this test file lives at web/tests/unit/portal-v3/tokens.test.ts
const webRoot = join(__dirname, "..", "..", "..");

const globalsCss = readFileSync(join(webRoot, "styles/globals.css"), "utf8");
const tailwindConfig = readFileSync(
  join(webRoot, "tailwind.config.ts"),
  "utf8",
);

// The 13 light-only CSS vars ported from the reference globals.css.
const REQUIRED_CSS_VARS = [
  "--v3-background",
  "--v3-foreground",
  "--v3-muted-foreground",
  "--v3-faint-foreground",
  "--v3-card",
  "--v3-sidebar",
  "--v3-sidebar-foreground",
  "--v3-border",
  "--v3-muted",
  "--v3-accent",
  "--v3-accent-foreground",
  "--v3-accent-muted",
  "--v3-ring",
];

// The semantic Tailwind color keys -> CSS var bindings.
const REQUIRED_COLOR_BINDINGS: Array<[string, string]> = [
  ["background", "--v3-background"],
  ["foreground", "--v3-foreground"],
  ["muted-foreground", "--v3-muted-foreground"],
  ["faint-foreground", "--v3-faint-foreground"],
  ["card", "--v3-card"],
  ["sidebar", "--v3-sidebar"],
  ["sidebar-foreground", "--v3-sidebar-foreground"],
  ["border", "--v3-border"],
  ["muted", "--v3-muted"],
  ["accent", "--v3-accent"],
  ["accent-foreground", "--v3-accent-foreground"],
  ["accent-muted", "--v3-accent-muted"],
  ["ring", "--v3-ring"],
];

describe("portal-v3 design tokens", () => {
  it.each(REQUIRED_CSS_VARS)("globals.css declares %s", (cssVar) => {
    // Match a declaration like `--v3-background:` (allowing whitespace).
    const re = new RegExp(`${cssVar}\\s*:`);
    expect(globalsCss).toMatch(re);
  });

  it.each(REQUIRED_COLOR_BINDINGS)(
    "tailwind.config.ts maps `%s` -> var(%s)",
    (key, cssVar) => {
      // Match `key: "var(--v3-...)"` or `"key": "var(--v3-...)"`.
      const re = new RegExp(
        `["']?${key}["']?\\s*:\\s*["']var\\(${cssVar}\\)["']`,
      );
      expect(tailwindConfig).toMatch(re);
    },
  );
});
