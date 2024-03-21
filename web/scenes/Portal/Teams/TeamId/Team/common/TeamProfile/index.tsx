"use client";
import { UserMultipleIcon } from "@/components/Icons/UserMultipleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { Image } from "./Image";
import { useFetchTeamLazyQuery } from "./graphql/client/fetch-team.generated";

export const TeamProfile = (props: { className?: string }) => {
  const [fetchTeam, { data }] = useFetchTeamLazyQuery();
  const { teamId } = useParams() as { teamId: string };

  useEffect(() => {
    if (!teamId) {
      return;
    }

    fetchTeam({
      variables: { teamId },
    });
  }, [fetchTeam, teamId]);

  return (
    <div className="grid gap-5 border-grey-200 py-8 max-md:mb-6 max-md:grid-flow-row max-md:justify-items-center max-md:rounded-2xl max-md:border max-md:px-6 max-md:pb-6 md:grid-cols-auto/1fr md:items-center md:border-b md:border-dashed">
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

      <div className="grid max-md:justify-items-center max-md:gap-1 md:gap-2">
        <Typography
          as="h1"
          variant={TYPOGRAPHY.H6}
          className="max-w-full truncate"
        >
          {data?.team_by_pk?.name ?? <Skeleton className="max-w-[200px]" />}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="max-md:text-base max-md:leading-6"
        >
          {!data?.team_by_pk?.memberships && (
            <Skeleton className="max-w-[120px]" />
          )}

          {data?.team_by_pk?.memberships && (
            <div className="grid grid-cols-auto/1fr items-center gap-x-2 text-grey-500">
              <UserMultipleIcon />

              <div className="truncate">
                {data?.team_by_pk?.memberships.length} members
              </div>
            </div>
          )}
        </Typography>
      </div>
    </div>
  );
};
