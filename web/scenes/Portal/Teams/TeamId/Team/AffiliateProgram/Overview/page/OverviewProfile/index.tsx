"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { GmailIcon } from "@/components/Icons/GmailIcon";
import { useAtom } from "jotai/index";
import { inviteUserDialogAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/InviteUserDialog";
import { AffiliateMetadataResponse } from "@/lib/types";
import { EnvelopeIcon } from "@/components/Icons/EnvelopeIcon";

type Props = {
  loading: boolean;
  data: AffiliateMetadataResponse["result"] | null;
};

export const OverviewProfile = (props: Props) => {
  const affiliateMetadata = props.data;
  const [_, setIsOpened] = useAtom(inviteUserDialogAtom);

  return (
    <div className="grid items-center gap-y-4 border-b border-dashed border-grey-200 py-10 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-6">
      <EnvelopeIcon className="hidden size-15 md:block" />

      <div className="grid grid-cols-1 gap-y-1">
        <Typography
          as="h1"
          variant={TYPOGRAPHY.H6}
          className="max-w-full truncate"
        >
          Overview
        </Typography>

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          {affiliateMetadata ? (
            `${affiliateMetadata?.totalInvites || 0} codes applied`
          ) : (
            <Skeleton className="max-w-[120px]" />
          )}
        </Typography>
      </div>

      <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-auto/1fr">
        {props.loading ? (
          <Skeleton width={193} height={48} className="rounded-xl" />
        ) : (
          <DecoratedButton
            type="button"
            variant="primary"
            onClick={() => setIsOpened(true)}
            className="h-12"
          >
            <GmailIcon className="size-5 text-white" /> Invite members
          </DecoratedButton>
        )}
      </div>
    </div>
  );
};
