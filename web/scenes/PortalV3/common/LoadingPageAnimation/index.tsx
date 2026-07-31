import { SpinnerBadgeIcon } from "@/components/Icons/SpinnerBadgeIcon";
import { cn } from "@/lib/utils";

/**
 * Suspense fallback for a portal content column, mounted below the persistent
 * shell so tab navigation commits immediately while the section's server
 * payload streams in. Invisible for the first 300ms so fast navigations never
 * flash a spinner; slower ones fade it in.
 *
 * `immediate` skips that delay — for hosts that already gate their own reveal
 * (the shell's optimistic navigation overlay), so the spinner doesn't wait
 * out two stacked 300ms budgets.
 */
export const LoadingPageAnimation = (props: { immediate?: boolean }) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn(
      "flex w-full animate-in justify-center pt-40 duration-200 fade-in",
      !props.immediate && "delay-300 fill-mode-both",
    )}
  >
    <SpinnerBadgeIcon className="size-6 animate-spin" />
  </div>
);
