import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

// #region Read the actual shipped tokens, not a duplicate test palette
const tokens: Record<string, string> = {};
const darkTokens: Record<string, string> = {};
for (const file of ["styles/globals.css", "styles/portal-theme.css"]) {
  postcss
    .parse(readFileSync(resolve(process.cwd(), file), "utf8"))
    .walkDecls((declaration) => {
      if (!declaration.prop.startsWith("--")) return;
      let dark = false;
      for (
        let parent: postcss.AnyNode | undefined = declaration.parent;
        parent;
        parent = parent.parent
      ) {
        if (
          parent.type === "atrule" &&
          parent.name === "variant" &&
          parent.params === "dark"
        )
          dark = true;
      }
      (dark ? darkTokens : tokens)[declaration.prop] = declaration.value;
    });
}

function color(name: string, depth = 0): string {
  if (depth > 5) throw new Error(`Circular token alias: ${name}`);
  const value = darkTokens[name] ?? tokens[name] ?? name;
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  if (alias) return color(alias[1], depth + 1);
  if (!/^#[\da-f]{6}$/i.test(value))
    throw new Error(`Not an opaque RGB token: ${name}=${value}`);
  return value;
}

function luminance(token: string) {
  const hex = color(token);
  return [1, 3, 5].reduce((sum, offset, index) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return (
      sum +
      (channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index]
    );
  }, 0);
}

function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}
// #endregion

// #region Text, actions and required control boundaries
describe("dark portal token contrast", () => {
  it.each([
    "--color-portal-canvas",
    "--color-surface",
    "--color-surface-raised",
    "--color-surface-muted",
  ])("keeps primary and supporting copy readable on %s", (background) => {
    for (const foreground of [
      "--color-content-primary",
      "--color-content-secondary",
      "--color-content-description",
      "--color-content-validation",
      "--color-content-link",
    ]) {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    ["--color-action-foreground", "--color-action"],
    ["--color-action-foreground", "--color-action-hover"],
    ["--color-portal-text", "--color-portal-border"],
    ["--color-content-error-500", "--color-surface-error-50"],
    ["--color-content-success-500", "--color-surface-success-50"],
    ["--color-content-warning-650", "--color-surface-warning-75"],
    ["#ffffff", "--color-system-error-600"],
    ["#ffffff", "--color-system-error-800"],
  ])("keeps %s readable on %s", (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    "--color-surface",
    "--color-surface-raised",
    "--color-portal-canvas",
  ])(
    "keeps control borders and focus indicators distinguishable on %s",
    (background) => {
      expect(
        contrast("--color-control-border", background),
      ).toBeGreaterThanOrEqual(3);
      expect(contrast("--color-focus", background)).toBeGreaterThanOrEqual(3);
    },
  );
});
// #endregion
