"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { Image } from "./Image";
import { useFetchTeamLazyQuery } from "./graphql/client/fetch-team.generated";
import { DecoratedButton } from "@/components/DecoratedButton";
import { GmailIcon } from "@/components/Icons/GmailIcon";
import { useAtom } from "jotai/index";
import { inviteUserDialogAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/InviteUserDialog";
import { AffiliateMetadataResponse } from "@/lib/types";

type Props = {
  data: AffiliateMetadataResponse | null;
};

export const TeamAffiliateProfile = (props: Props) => {
  const affiliateMetadata = props.data;
  const [fetchTeam, { data }] = useFetchTeamLazyQuery();
  const { teamId } = useParams() as { teamId: string };
  const [_, setIsOpened] = useAtom(inviteUserDialogAtom);

  useEffect(() => {
    if (!teamId) {
      return;
    }

    fetchTeam({
      variables: { teamId },
    });
  }, [fetchTeam, teamId]);

  return (
    <div className="grid items-center justify-items-center gap-y-4 py-10 sm:grid-cols-auto/1fr/auto sm:justify-items-start sm:gap-x-8">
      <div>
        {!data?.team_by_pk?.name && (
          <Skeleton
            className="size-20 rounded-2xl leading-normal"
            inline={false}
          />
        )}

        {data?.team_by_pk?.name && (
          <div className="size-20 overflow-hidden rounded-2xl">
            <Image
              src={null} // FIXME: Pass the correct src
              teamName={data?.team_by_pk?.name}
              alt="Team logo"
            />
          </div>
        )}
      </div>

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
        <DecoratedButton
          type="button"
          variant="primary"
          onClick={() => setIsOpened(true)}
          className="h-12"
        >
          <GmailIcon className="size-5 text-white" /> Invite members
        </DecoratedButton>
      </div>
    </div>
  );
};
