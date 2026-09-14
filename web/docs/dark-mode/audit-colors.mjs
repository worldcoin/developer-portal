// Read-only static audit. Run from web/: node docs/dark-mode/audit-colors.mjs
// Emits JSON to stdout; deliberately does not change application files.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const read = (path) => readFileSync(path, "utf8");
const snapshot = JSON.parse(read("docs/dark-mode/figma-primitives.json"));
const css = read("styles/globals.css");
const postcss = (await import("postcss")).default;
const definitions = [];
const defaultColors = new Map();
postcss.parse(read("node_modules/tailwindcss/theme.css")).walkDecls((d) => {
  if (d.prop.startsWith("--color-")) defaultColors.set(d.prop, d.value);
});
const localColors = new Map(defaultColors);
postcss.parse(css).walkDecls((d) => {
  if (!d.prop.startsWith("--")) return;
  const scope = d.parent.selector ?? `@${d.parent.name} ${d.parent.params}`;
  definitions.push({
    name: d.prop,
    value: d.value,
    scope,
    line: d.source.start.line,
  });
  if (d.prop.startsWith("--color-")) localColors.set(d.prop, d.value);
});
const base = new Map(
  definitions.filter((d) => d.scope === ":root").map((d) => [d.name, d.value]),
);
function resolve(value, seen = new Set()) {
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  if (!alias) return value;
  if (seen.has(alias[1])) throw new Error(`Color alias cycle: ${alias[1]}`);
  seen.add(alias[1]);
  const next = base.get(alias[1]) ?? localColors.get(alias[1]);
  return next ? resolve(next, seen) : value;
}
const linear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function lab(rgb) {
  const [r, g, b] = rgb.map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function parse(input) {
  let value = resolve(input).toLowerCase().trim();
  value =
    { white: "#ffffff", black: "#000000", transparent: "#00000000" }[value] ??
    value;
  if (/^#[\da-f]{3,4}$/.test(value))
    value = "#" + [...value.slice(1)].map((c) => c + c).join("");
  if (/^#[\da-f]{6}([\da-f]{2})?$/.test(value)) {
    const rgb = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
    return {
      lab: lab(rgb),
      alpha: value.length === 9 ? parseInt(value.slice(7), 16) / 255 : 1,
    };
  }
  const functional = /^(rgba?|oklch|hsla?)\(([^()]*)\)$/.exec(value);
  if (!functional) return null;
  const values = functional[2]
    .replaceAll(",", " ")
    .replaceAll("/", " ")
    .trim()
    .split(/\s+/);
  const alpha = values[3]
    ? parseFloat(values[3]) / (values[3].includes("%") ? 100 : 1)
    : 1;
  if (functional[1] === "oklch") {
    const [l, c, h] = values.map(parseFloat);
    return {
      lab: [
        l / (values[0].includes("%") ? 100 : 1),
        c * Math.cos((h * Math.PI) / 180),
        c * Math.sin((h * Math.PI) / 180),
      ],
      alpha,
    };
  }
  if (functional[1].startsWith("rgb"))
    return {
      lab: lab(
        values
          .slice(0, 3)
          .map((v) => parseFloat(v) / (v.includes("%") ? 100 : 255)),
      ),
      alpha,
    };
  const [h, s, l] = values.map(parseFloat);
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { lab: lab([f(0), f(8), f(4)]), alpha };
}
const primitives = snapshot.primitives.map((p) => ({
  ...p,
  lab: parse(p.hex).lab,
}));
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const closest = (target, pool) =>
  [...pool].sort(
    (a, b) => distance(target, a.lab) - distance(target, b.lab),
  )[0];
const brief = (p) => ({ token: p.name, hex: p.hex });
function mapping(value) {
  if (["currentColor", "inherit"].includes(value))
    return { status: "preserve-inheritance", nearest: null, opposite: null };
  const color = parse(value);
  if (!color || color.lab.some((v) => !Number.isFinite(v)))
    return { status: "unresolved-expression", nearest: null, opposite: null };
  if (color.alpha === 0)
    return {
      status: "preserve-transparency",
      alpha: 0,
      nearest: null,
      opposite: null,
    };
  const nearest = closest(color.lab, primitives);
  // Tonal opposite, preserving hue family. Not RGB complement or a UI recommendation.
  const family = nearest.name.split("/").slice(0, 2).join("/");
  const pool = primitives.filter((p) => p.name.startsWith(family + "/"));
  const min = Math.min(...pool.map((p) => p.lab[0]));
  const max = Math.max(...pool.map((p) => p.lab[0]));
  const l = Math.max(min, Math.min(max, color.lab[0]));
  const opposite = closest([min + max - l, color.lab[1], color.lab[2]], pool);
  return {
    status:
      color.alpha < 1
        ? "review-alpha-compositing"
        : "candidate-needs-role-review",
    alpha: color.alpha,
    nearest: brief(nearest),
    distanceOklab: Number(distance(color.lab, nearest.lab).toFixed(4)),
    opposite: brief(opposite),
    sparseFamily: pool.length < 3,
  };
}
const entries = new Map();
function add(kind, name, value, file, line) {
  const key = `${kind}:${name}`;
  if (!entries.has(key))
    entries.set(key, {
      kind,
      name,
      value,
      count: 0,
      examples: [],
      ...mapping(value),
    });
  const e = entries.get(key);
  e.count++;
  if (e.examples.length < 3 && !e.examples.includes(`${file}:${line}`))
    e.examples.push(`${file}:${line}`);
}
for (const d of definitions) {
  if (
    parse(d.value) ||
    d.name.startsWith("--color-") ||
    /color|shadow/.test(d.name)
  ) {
    add(
      "definition",
      `${d.scope} ${d.name}`,
      d.value,
      "styles/globals.css",
      d.line,
    );
  }
}
const files = execFileSync(
  "git",
  [
    "ls-files",
    "-z",
    "app",
    "components",
    "scenes",
    "styles",
    "lib",
    "hooks",
    "public",
  ],
  { encoding: "utf8", timeout: 10000 },
)
  .split("\0")
  .filter(
    (f) =>
      /\.(tsx?|jsx?|css|svg)$/.test(f) &&
      !/\.generated\.|(^|\/)tests?\//.test(f),
  );
const literals =
  /#[\da-fA-F]{8}\b|#[\da-fA-F]{6}\b|#[\da-fA-F]{4}\b|#[\da-fA-F]{3}\b|\b(?:rgba?|hsla?|oklch)\([^()]*\)/g;
const utility =
  /\b(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide(?:-[xy])?|fill|stroke|from|via|to|shadow|decoration|placeholder|caret|accent)-([a-zA-Z][\w-]*)(?:\/(\d+))?/g;
for (const file of files) {
  read(file)
    .split("\n")
    .forEach((line, i) => {
      for (const m of line.matchAll(literals))
        add(
          file.endsWith(".svg") ? "asset-literal" : "literal",
          m[0].toLowerCase(),
          m[0],
          file,
          i + 1,
        );
      for (const m of line.matchAll(utility)) {
        const value = localColors.get(`--color-${m[1]}`);
        if (value) {
          add("utility", m[0], value, file, i + 1);
          if (m[2]) {
            const e = entries.get(`utility:${m[0]}`);
            e.utilityOpacity = Number(m[2]) / 100;
            e.status = "review-alpha-compositing";
          }
        } else if (["transparent", "current", "inherit"].includes(m[1]))
          add(
            "utility",
            m[0],
            m[1] === "current" ? "currentColor" : m[1],
            file,
            i + 1,
          );
      }
      for (const m of line.matchAll(
        /(?:["']|:\s*|=\s*["'])(white|black|transparent|currentColor)(?=["';,\s}])/g,
      ))
        add("named-literal", m[1], m[1], file, i + 1);
    });
}
const colors = [...entries.values()].sort(
  (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
);
process.stdout.write(
  JSON.stringify(
    {
      source: snapshot.source,
      method:
        "Euclidean OKLab nearest primitive; opposite reflects lightness within the nearest primitive family, preserving a/b. Candidate only; semantic roles and contrast override.",
      scope:
        "Tracked frontend TS/JS/CSS/SVG in app, components, scenes, styles, lib, hooks, public; generated and test files excluded. Includes admin and legacy routes. Static lexical scan, not rendered or reachability audit. Untracked FedScreens excluded.",
      limitations: [
        "Runtime/user-uploaded images, raster pixels, third-party stylesheet/syntax colors, dynamically assembled classes and colors are not exhaustively enumerable.",
        "Lexical literals can include comments or example code; examples need review. CSS functional expressions that cannot resolve are explicitly marked.",
        "Counts are occurrences per entry; definitions and their utility uses overlap. Entries are not distinct rendered colors. Utility values resolve in light mode; explicit dark definitions are separate entries.",
        "Specialty two-stop families lack suitable dark tints; sparseFamily=true requires design review. Tokens/* identity colors are preserved separately in the Figma snapshot, excluded from generic UI nearest matching.",
      ],
      fileCount: files.length,
      summary: Object.fromEntries(
        [...new Set(colors.map((c) => c.kind))].map((kind) => [
          kind,
          colors.filter((c) => c.kind === kind).length,
        ]),
      ),
      colors,
    },
    null,
    2,
  ) + "\n",
);
