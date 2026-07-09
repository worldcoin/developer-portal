"use client";

import { Button } from "@/components/Button";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";

type InReviewBannerProps = {
  teamId: string;
  onUnsubmit: () => void;
  loading?: boolean;
};

/**
 * Neutral status strip shown while the draft is awaiting review: explains why
 * every field is disabled and offers the only unlock path (un-submit). The
 * warning-toned counterpart for rejected drafts is RejectionBanner.
 */
export const InReviewBanner = ({
  teamId,
  onUnsubmit,
  loading,
}: InReviewBannerProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const canUnsubmit = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  return (
    <div className="flex items-center gap-3 rounded-20 border border-grey-200 bg-grey-50 p-5">
      <span
        className="size-2 shrink-0 rounded-full bg-additional-blue-500"
        aria-hidden
      />

      <Typography variant={TYPOGRAPHY.R4} className="flex-1 text-grey-700">
        In review — editing is locked until review completes.
      </Typography>

      {canUnsubmit && (
        <Button
          type="button"
          onClick={onUnsubmit}
          disabled={loading}
          className="shrink-0 rounded-full bg-grey-900 px-4 py-2 text-white hover:opacity-90"
        >
          <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
            Un-submit
          </Typography>
        </Button>
      )}
    </div>
  );
};
