// Verifies the shared optical corrections for stepper digits and warning
// badges. Flex centers line/image boxes, not the visible glyph: World Pro
// reserves descender space below digits, while the warning triangle carries
// most of its visual mass below the center of its SVG box.
//
// The page is written to disk and loaded via file:// — a setContent page is
// about:blank, which silently refuses file:// fonts, and the measurement
// then validates the fallback font instead. That exact failure once hid the
// 2.75px drift behind a passing check, so the script now also hard-fails
// when document.fonts.check says WorldPro didn't load.
//
// Run after touching bubble markup, the correction offset, or the font file:
//   node scripts/check-optical-centering.mjs
// Exits non-zero if the corrected bubble drifts more than TOLERANCE_PX.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FONT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app/fonts/WorldProMVP.ttf",
);
const ALERT_ICON_SOURCE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../components/Icons/AlertIcon.tsx",
);
const alertIconPath = fs
  .readFileSync(ALERT_ICON_SOURCE_PATH, "utf8")
  .match(/\bd="([^"]+)"/)?.[1];
if (!alertIconPath) {
  throw new Error("Could not read the AlertIcon path for optical measurement");
}
// Must mirror bubbleDigitClassName in scenes/PortalV3/common/Icon.
const CORRECTION = "0.12em";
const CORRECTION_PX = 0.12 * 13;
// Must mirror opticalIconClassName in scenes/PortalV3/common/Icon.
const WARNING_CORRECTION = "-1px";
const WARNING_CORRECTION_PX = 1;
// Uncorrected ink drift of WorldProMVP digits at text-13 — re-derive if the
// font file changes.
const EXPECTED_BASELINE_PX = 2.69;
// At 16px wide, the triangle's alpha-weighted visual mass sits this far below
// the center of its SVG box before the shared lift is applied.
const EXPECTED_WARNING_MASS_DRIFT_PX = -1.12;
const TOLERANCE_PX = 0.2;
const SCALE = 8;
const DIGITS = ["1", "2", "3", "4"];

const launch = async () => {
  // Prefer the bundled browser; fall back to system Chrome when the
  // playwright download step hasn't been run on this machine.
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ channel: "chrome" });
  }
};

const browser = await launch();
const page = await browser.newPage({ deviceScaleFactor: SCALE });

const dots = ["0px", CORRECTION]
  .flatMap((offset, oi) =>
    DIGITS.map(
      (digit, di) =>
        `<div class="dot" id="d${oi}_${di}"><span style="display:inline-block;transform:translateY(${offset})">${digit}</span></div>`,
    ),
  )
  .join("\n");
const warningBadges = ["0px", WARNING_CORRECTION]
  .map(
    (offset, index) =>
      `<div class="warning-badge" id="warning-${index}"><svg viewBox="0 0 24 24" style="transform:translateY(${offset})"><path fill-rule="evenodd" clip-rule="evenodd" d="${alertIconPath}" fill="#fff" /></svg></div>`,
  )
  .join("\n");

const probePath = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "optical-centering-")),
  "probe.html",
);
fs.writeFileSync(
  probePath,
  `
  <style>
    @font-face { font-family: WorldPro; src: url('file://${FONT_PATH}'); font-weight: 300 800; }
    body { margin: 0; background: #fff; }
    .dot {
      width: 20px; height: 20px; border-radius: 9999px;
      background: #1f1f1f; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-family: WorldPro; font-size: 13px; line-height: 1.2;
      font-weight: 500; text-align: center; margin: 6px;
    }
    .warning-badge {
      width: 32px; height: 32px; border-radius: 9999px;
      background: #ffae00;
      display: flex; align-items: center; justify-content: center;
      margin: 6px;
    }
    .warning-badge svg { display: block; width: 16px; height: 16px; }
  </style>
  ${dots}
  ${warningBadges}
`,
);
await page.goto(`file://${probePath}`);
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => document.fonts.check("13px WorldPro")))) {
  console.error(
    "WorldPro failed to load — the measurement would silently validate a fallback font.",
  );
  await browser.close();
  process.exit(1);
}

const measure = async (id) => {
  const buf = await page.locator(`#${id}`).screenshot();
  const b64 = buf.toString("base64");
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const cx = (img.width - 1) / 2;
    const cy = (img.height - 1) / 2;
    // Stay well inside the circle so the page background around the
    // border-radius never registers as glyph ink.
    const r = img.width / 2 - img.width * 0.1;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const i = (y * img.width + x) * 4;
        if (data[i] > 140 && data[i + 1] > 140 && data[i + 2] > 140) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return { minY, maxY, height: img.height };
  }, b64);
};

const averages = {};
for (const [oi, label] of [
  ["0", "uncorrected"],
  ["1", "corrected  "],
]) {
  const drifts = [];
  for (const di of DIGITS.keys()) {
    const { minY, maxY, height } = await measure(`d${oi}_${di}`);
    drifts.push(((height - 1) / 2 - (minY + maxY) / 2) / SCALE);
  }
  const avg = drifts.reduce((a, b) => a + b, 0) / drifts.length;
  averages[label.trim()] = avg;
  console.log(
    `${label} drift per digit [${drifts.map((d) => d.toFixed(2)).join(", ")}] avg=${avg.toFixed(3)}px`,
  );
}

const measureWarningMass = async (id) => {
  const buf = await page.locator(`#${id}`).screenshot();
  const b64 = buf.toString("base64");
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const cx = (img.width - 1) / 2;
    const cy = (img.height - 1) / 2;
    const r = img.width / 2 - img.width * 0.1;
    let mass = 0;
    let weightedY = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const i = (y * img.width + x) * 4;
        // The badge background has a zero blue channel and the glyph is white,
        // so blue intensity is the anti-alias-aware glyph coverage.
        const coverage = data[i + 2] / 255;
        mass += coverage;
        weightedY += coverage * y;
      }
    }
    return { centroidY: weightedY / mass, centerY: cy };
  }, b64);
};

const warningDrifts = [];
for (const index of [0, 1]) {
  const { centroidY, centerY } = await measureWarningMass(`warning-${index}`);
  warningDrifts.push((centerY - centroidY) / SCALE);
}
const [uncorrectedWarningDrift, correctedWarningDrift] = warningDrifts;
const warningAppliedShift = correctedWarningDrift - uncorrectedWarningDrift;
console.log(
  `warning mass drift uncorrected=${uncorrectedWarningDrift.toFixed(3)}px corrected=${correctedWarningDrift.toFixed(3)}px`,
);
console.log(
  `warning applied shift ${warningAppliedShift.toFixed(3)}px (expected ${WARNING_CORRECTION_PX.toFixed(2)}px)`,
);

await browser.close();

// The font's metrics still match what the offset was derived against…
const baselineOff = Math.abs(averages.uncorrected - EXPECTED_BASELINE_PX);
// …and the codified correction really moves the glyph by that amount.
const appliedShift = averages.uncorrected - averages.corrected;
const shiftOff = Math.abs(appliedShift - CORRECTION_PX);
console.log(
  `applied shift ${appliedShift.toFixed(3)}px (expected ${CORRECTION_PX.toFixed(2)}px)`,
);

if (baselineOff > TOLERANCE_PX) {
  console.error(
    `\nUncorrected drift ${averages.uncorrected.toFixed(2)}px no longer matches the` +
      ` font's known ${EXPECTED_BASELINE_PX}px — the font file changed; re-derive` +
      ` the offset (see bubbleDigitClassName in scenes/PortalV3/common/Icon).`,
  );
  process.exit(1);
}
if (shiftOff > TOLERANCE_PX) {
  console.error(
    `\nThe rendered correction (${appliedShift.toFixed(2)}px) doesn't match the` +
      ` codified ${CORRECTION} — bubble markup and bubbleDigitClassName drifted apart.`,
  );
  process.exit(1);
}
const warningBaselineOff = Math.abs(
  uncorrectedWarningDrift - EXPECTED_WARNING_MASS_DRIFT_PX,
);
const warningShiftOff = Math.abs(warningAppliedShift - WARNING_CORRECTION_PX);
if (warningBaselineOff > TOLERANCE_PX) {
  console.error(
    `\nUncorrected warning mass drift ${uncorrectedWarningDrift.toFixed(2)}px no longer matches the` +
      ` glyph's known ${EXPECTED_WARNING_MASS_DRIFT_PX}px — AlertIcon changed; re-derive` +
      " the optical offset in WarningBadgeIcon.",
  );
  process.exit(1);
}
if (
  warningShiftOff > TOLERANCE_PX ||
  Math.abs(correctedWarningDrift) >= Math.abs(uncorrectedWarningDrift)
) {
  console.error(
    `\nThe warning correction moved visual mass by ${warningAppliedShift.toFixed(2)}px` +
      ` instead of ${WARNING_CORRECTION_PX}px, or moved it farther from center.`,
  );
  process.exit(1);
}
console.log(
  "\nBubble digits and warning badges carry their optical corrections.",
);
