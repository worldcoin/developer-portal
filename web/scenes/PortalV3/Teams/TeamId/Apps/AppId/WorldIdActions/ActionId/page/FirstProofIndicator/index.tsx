import { TYPOGRAPHY, Typography } from "@/components/Typography";

/**
 * The payoff moment, shown on the action page beside the Quickstart: while an
 * action has no verifications it invites the developer to produce their first
 * proof; the instant one lands (the page polls) it flips to a brief
 * celebration in place — right next to the integration snippet they just used.
 */
export const FirstProofIndicator = (props: {
  variant: "waiting" | "received";
}) => {
  if (props.variant === "received") {
    return (
      <div
        className="border-system-success-200 flex items-center gap-x-3 rounded-xl border bg-system-success-50 p-4"
        data-testid="first-proof-received"
      >
        <span className="grid size-6 place-items-center rounded-full bg-system-success-500 text-white">
          ✓
        </span>
        <div className="grid">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="text-system-success-800"
          >
            First proof received!
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="text-system-success-700"
          >
            Your integration is verifying real humans.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-x-3 rounded-xl border border-grey-200 bg-grey-50 p-4"
      data-testid="first-proof-waiting"
    >
      <span
        className="size-2.5 animate-pulse rounded-full bg-blue-500"
        aria-hidden="true"
      />
      <div className="grid">
        <Typography variant={TYPOGRAPHY.M4}>
          Waiting for your first verification…
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Trigger the widget below — it updates here automatically.
        </Typography>
      </div>
    </div>
  );
};
