"use client";

import { useFetchTeamLazyQuery } from "./graphql/client/fetch-team.generated";
import { Fragment, useEffect } from "react";
import { useParams } from "next/navigation";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { UserMultipleIcon } from "@/components/Icons/UserMultipleIcon";
import { Image } from "./Image";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export const TeamProfile = (props: { className?: string }) => {
  const [fetchTeam, { data }] = useFetchTeamLazyQuery();
  const { teamId } = useParams() as { teamId: string };

  useEffect(() => {
    if (!teamId) {
      return;
    }

    fetchTeam({
      variables: { teamId },
      context: { headers: { team_id: teamId } },
    });
  }, [fetchTeam, teamId]);

  return (
    <div
      className={twMerge(
        clsx(
          "grid grid-cols-auto/1fr grid-rows-2 gap-x-5 gap-y-2 justify-self-start py-8 border-b border-dashed border-grey-200",
          props.className,
        ),
      )}
    >
      <div className="row-span-2 w-20 h-20 rounded-2xl overflow-hidden">
        {data?.team_by_pk?.name && (
          // FIXME: Pass the correct src
          <Image src={null} teamName={data?.team_by_pk?.name} alt="Team logo" />
        )}

        {!data?.team_by_pk?.name && (
          <Skeleton className="w-full h-full rounded-2xl" />
        )}
      </div>

      <Typography as="h1" variant={TYPOGRAPHY.H6} className="self-end">
        {data?.team_by_pk?.name ?? <Skeleton className="max-w-[200px]" />}
      </Typography>

      <div className="text-grey-500 grid grid-cols-auto/1fr items-center gap-x-2 self-start">
        {data?.team_by_pk?.memberships && (
          <Fragment>
            <UserMultipleIcon />

            <Typography variant={TYPOGRAPHY.R4}>
              {data?.team_by_pk?.memberships.length} members
            </Typography>
          </Fragment>
        )}

        {!data?.team_by_pk?.memberships && <Skeleton width={120} />}
      </div>
    </div>
  );
};
