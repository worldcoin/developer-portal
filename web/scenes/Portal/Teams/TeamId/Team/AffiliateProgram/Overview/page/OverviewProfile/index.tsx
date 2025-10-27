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
  data: AffiliateMetadataResponse | null;
};

export const TeamAffiliateProfile = (props: Props) => {
  const affiliateMetadata = props.data;
  const [_, setIsOpened] = useAtom(inviteUserDialogAtom);

  return (
    <div className="grid items-center gap-y-4 py-10 sm:grid-cols-auto/1fr/auto sm:gap-x-6">
      <EnvelopeIcon className="hidden size-15 md:block" />

      <div className="grid grid-cols-1 gap-y-1">
        <Typography
          as="h1"
          variant={TYPOGRAPHY.H6}
          className="max-w-full truncate"
        >
          Overview
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="max-md:text-base max-md:leading-6"
        >
          {!affiliateMetadata && <Skeleton className="max-w-[120px]" />}

          {affiliateMetadata?.totalInvites && (
            <div className="grid grid-cols-auto/1fr items-center gap-x-2 truncate text-grey-500">
              {affiliateMetadata?.totalInvites} codes applied
            </div>
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
