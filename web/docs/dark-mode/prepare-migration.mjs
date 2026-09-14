// Generates a reviewable patch and semantic CSS aliases; does not write files.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const css = readFileSync("styles/globals.css", "utf8");
const values = new Map(
  [...css.matchAll(/--color-([\w-]+):\s*(#[\da-f]+);/gi)].map((m) => [
    m[1],
    m[2],
  ]),
);
values.set("white", "#ffffff");
values.set("black", "#000000");
const mappings = new Map();
const aliases = new Map();
function add(oldClass, name, dark) {
  const prefix = oldClass.slice(0, oldClass.indexOf("-"));
  const color = oldClass.slice(prefix.length + 1);
  const light = values.get(color);
  if (!light) throw new Error(`Missing ${color}`);
  if (aliases.has(name) && aliases.get(name).light !== light)
    throw new Error(`Alias collision ${name}`);
  aliases.set(name, { light, dark });
  mappings.set(oldClass, `${prefix}-${name}`);
}
for (const [color, name, dark] of [
  ["grey-900", "content-primary", "#f9fafb"],
  ["grey-700", "content-strong", "#d6d9dd"],
  ["grey-500", "content-secondary", "#9ba3ae"],
  ["grey-400", "content-tertiary", "#9ba3ae"],
  ["grey-300", "content-disabled", "#838d9b"],
  ["grey-200", "content-faint", "#838d9b"],
  ["black", "content-black", "#f9fafb"],
  ["portal-ink", "content-ink", "#f9fafb"],
  ["portal-blue", "content-link", "#66a3ff"],
  ["portal-purple", "content-purple", "#d6b1ff"],
  ["blue-500", "content-link-legacy", "#66a3ff"],
])
  add(`text-${color}`, name, dark);
for (const [color, name, dark] of [
  ["white", "surface", "#1f1f1f"],
  ["grey-0", "surface", "#1f1f1f"],
  ["grey-25", "surface-faint", "#272727"],
  ["grey-50", "surface-soft", "#272727"],
  ["grey-70", "surface-hover-soft", "#2f2f2f"],
  ["grey-100", "surface-muted", "#2f2f2f"],
  ["grey-200", "surface-disabled", "#3c424b"],
  ["grey-300", "surface-strong", "#3c424b"],
  ["blue-50", "surface-info-faint", "#202838"],
  ["blue-100", "surface-info-soft", "#002466"],
  ["blue-150", "surface-info-strong", "#003799"],
])
  add(`bg-${color}`, name, dark);
for (const prefix of ["border", "divide", "ring", "outline"]) {
  for (const [color, name, dark] of [
    ["grey-100", "edge-subtle", "#3c424b"],
    ["grey-200", "edge", "#3c424b"],
    ["grey-300", "edge-medium", "#717680"],
    ["grey-400", "edge-strong", "#838d9b"],
    ["grey-700", "edge-heavy", "#9ba3ae"],
    ["grey-900", "edge-ink", "#d6d9dd"],
    ["blue-150", "focus-soft", "#66a3ff"],
    ["blue-500", "focus", "#99c2ff"],
  ])
    add(`${prefix}-${color}`, name, dark);
}
add("caret-grey-900", "content-primary", "#f9fafb");
for (const [color, light] of values) {
  const match = /^system-(error|success|warning)-(\d+)$/.exec(color);
  if (!match) continue;
  const [, family, step] = match;
  const ink = { error: "#f97b6f", success: "#99e8b3", warning: "#ffdb99" }[
    family
  ];
  const surface = { error: "#611005", success: "#004d13", warning: "#664600" }[
    family
  ];
  add(`text-${color}`, `content-${family}-${step}`, ink);
  add(`border-${color}`, `edge-${family}-${step}`, ink);
  add(`ring-${color}`, `edge-${family}-${step}`, ink);
  if (Number(step) <= 300)
    add(`bg-${color}`, `surface-${family}-${step}`, surface);
}
add("text-danger", "content-danger", "#f97b6f");
add("border-danger", "edge-danger", "#f97b6f");
const files = execFileSync("git", ["ls-files", "-z", "components", "scenes"], {
  encoding: "utf8",
  timeout: 10000,
})
  .split("\0")
  .filter(
    (f) =>
      /\.tsx$/.test(f) &&
      !f.includes(".generated.") &&
      !/\/Icons\/|\/Icon\/|QRCode|\/Landing\/|\/LivePreview\//.test(f),
  );
const patches = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  const changes = [];
  lines.forEach((line, index) => {
    let next = line.replace(
      /(?<![\w-])(?:text|bg|border|divide|ring|outline|caret)-(?:system-[\w-]+|grey-\d+|blue-\d+|portal-(?:ink|blue|purple)|white|black|danger)(?![\w-])/g,
      (token) => mappings.get(token) ?? token,
    );
    // Only invert explicitly paired neutral action colors, never brand tiles,
    // photographic overlays, QR codes, or other white-on-color labels.
    if (/bg-portal-ink\b/.test(next) && /text-white\b/.test(next)) {
      next = next
        .replace(/bg-portal-ink-hover\b/g, "bg-action-hover")
        .replace(/bg-portal-ink\b/g, "bg-action")
        .replace(/text-white\b/g, "text-action-foreground");
    }
    if (next !== line)
      changes.push({ line: index + 1, before: line, after: next });
  });
  if (changes.length) patches.push({ file, changes });
}
process.stdout.write(
  JSON.stringify({
    aliases: [...aliases].map(([name, v]) => ({ name, ...v })),
    patches,
  }),
);
