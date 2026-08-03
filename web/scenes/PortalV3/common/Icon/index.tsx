import { AlertIcon } from "@/components/Icons/AlertIcon";
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
 * Optical alignment for the size-8 icon in a two-line notice card (the Mini App
 * "unavailable" banners). `items-start` aligns the icon box with the first
 * line's line box, but the text reads as the band from its cap top to the last
 * baseline — measured in the browser at text-13/120%, that band's center sits
 * 2px above the icon's ink center, so the icon reads low. Nudge it up to match.
 */
export const noticeIconClassName = "shrink-0 -translate-y-[2px]";

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
 * Renders a static SVG asset from `public/images/portal-v3/icons`. Decorative
 * by default (`alt=""` + `aria-hidden`), so give the surrounding control its
 * own accessible label. Pass `className` for sizing/color.
 *
 * `block` is important: an inline <img> sits on the text baseline and carries a
 * descender gap, which pushes the glyph a couple px off-center from adjacent
 * labels (e.g. the sidebar rows). Block removes that so `items-center` lines it
 * up exactly. Callers can still override the display via `className`.
 */
export const Icon = (props: { name: string; className?: string }) => (
  <img
    src={`${ICON_PATH}/${props.name}.svg`}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={twMerge("block", props.className)}
  />
);

/**
 * Canonical warning glyph for the 32px circular badges used throughout app
 * configuration. The triangle's visual mass sits below its geometric center,
 * so the shared optical lift belongs here rather than at each call site.
 */
export const WarningBadgeIcon = (props: { className?: string }) => (
  <span
    aria-hidden="true"
    className={twMerge(
      "flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600",
      props.className,
    )}
  >
    <AlertIcon className={twMerge("size-4 text-white", opticalIconClassName)} />
  </span>
);
