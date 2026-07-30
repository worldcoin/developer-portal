import { twMerge } from "tailwind-merge";

const ICON_PATH = "/images/portal-v3/icons";

/**
 * Optical alignment for an icon sitting beside cap-height text. Labels use
 * tight leading (`leading-none` / `leading-[1.2]`), so their glyphs sit high
 * in the line box while the descender space hangs below — a geometrically
 * centered icon therefore reads ~1px low next to the text. Put this on the
 * icon (or its wrapping slot) in any icon+label row instead of re-deriving
 * the nudge per call site.
 */
export const opticalIconClassName = "shrink-0 -translate-y-px";

/**
 * Optical alignment for a digit (or other cap-height glyph) inside a fixed
 * circle/pill, e.g. the wizard stepper dots. Flex centers the text's LINE BOX,
 * but World Pro's descender space hangs below digits that have none, so the
 * glyph paints high — measured ink drift with the real WorldProMVP.ttf is
 * ~2.75px at text-13 (≈0.21em). Exact ink-bounding-box centering (0.21em)
 * reads too LOW to the eye — digits want to sit slightly above true center —
 * so this offset is the eyeballed optical middle, roughly half the metric
 * drift. The em unit keeps it proportional to font size. Wrap the glyph in a
 * span with this class and verify with
 * `node web/scripts/check-optical-centering.mjs` after touching bubble
 * markup, the font file, or this offset — the script hard-fails if the font
 * doesn't load, because measuring a fallback font once hid the full 2.75px
 * drift behind a passing check.
 */
export const bubbleDigitClassName = "inline-block translate-y-[0.12em]";

/**
 * Icons whose color is meaningful (brand marks, status accents, white glyphs
 * that sit on fills which stay colored in dark mode). Everything else is a
 * monochrome grey glyph that `dark:invert` re-themes correctly — the SVGs are
 * loaded via <img>, so their baked-in fills can't see our CSS variables and a
 * filter is the only way to theme them without touching the assets.
 */
const UNTHEMED_ICONS = new Set([
  "clock",
  "clock-active",
  "edit-pencil",
  "dropdown-check",
  "card-wand",
  "card-toolkit",
  "credential-banner",
  "warning-triangle",
  "world-id-sandbox-app-icon",
]);

/**
 * Renders a static SVG asset from `public/images/portal-v3/icons`. Decorative
 * by default (`alt=""` + `aria-hidden`), so give the surrounding control its
 * own accessible label. Pass `className` for sizing/color.
 *
 * `block` is important: an inline <img> sits on the text baseline and carries a
 * descender gap, which pushes the glyph a couple px off-center from adjacent
 * labels (e.g. the sidebar rows). Block removes that so `items-center` lines it
 * up exactly. Callers can still override the display via `className`.
 *
 * Pass `unthemed` when a normally-inverted icon sits on a fill that keeps its
 * color in dark mode (e.g. the white `radio-check` on the stepper's green
 * chip).
 */
export const Icon = (props: {
  name: string;
  className?: string;
  unthemed?: boolean;
}) => (
  <img
    src={`${ICON_PATH}/${props.name}.svg`}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={twMerge(
      "block",
      !props.unthemed && !UNTHEMED_ICONS.has(props.name) && "dark:invert",
      props.className,
    )}
  />
);
