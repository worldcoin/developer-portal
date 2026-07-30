// Verifies that a digit inside a stepper-style bubble paints optically
// centered with the real WorldProMVP font. Flex centers the text's LINE BOX,
// not the glyph: World Pro reserves descender space below digits (which have
// none), so an uncorrected digit paints ~0.42px high at text-13 — a full
// device pixel at 2x DPR. `bubbleDigitClassName` in
// scenes/PortalV3/common/Icon compensates with translate-y-[0.03em]; this
// script renders the bubble recipe with and without that correction and
// measures the glyph ink against the circle center, pixel row by pixel row.
//
// Run after touching bubble markup, the correction offset, or the font file:
//   node scripts/check-optical-centering.mjs
// Exits non-zero if the corrected bubble drifts more than TOLERANCE_PX.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FONT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app/fonts/WorldProMVP.ttf",
);
// Must mirror bubbleDigitClassName in scenes/PortalV3/common/Icon.
const CORRECTION = "0.03em";
const TOLERANCE_PX = 0.15;
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

await page.setContent(`
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
  </style>
  ${dots}
`);
await page.evaluate(() => document.fonts.ready);

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

let failed = false;
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
  const status =
    label.trim() === "corrected"
      ? Math.abs(avg) <= TOLERANCE_PX
        ? "OK"
        : "FAIL"
      : "(baseline)";
  if (status === "FAIL") failed = true;
  console.log(
    `${label} drift per digit [${drifts.map((d) => d.toFixed(2)).join(", ")}] avg=${avg.toFixed(3)}px ${status}`,
  );
}

await browser.close();

if (failed) {
  console.error(
    `\nCorrected bubble digit drifts more than ${TOLERANCE_PX}px from center.` +
      `\nRe-derive the offset (see bubbleDigitClassName in scenes/PortalV3/common/Icon).`,
  );
  process.exit(1);
}
console.log("\nBubble digits are optically centered.");
