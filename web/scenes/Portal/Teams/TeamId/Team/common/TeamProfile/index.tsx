"use client";

import { UserMultipleIcon } from "@/components/Icons/UserMultipleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { Fragment, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";
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
      context: { headers: { team_id: teamId } },
    });
  }, [fetchTeam, teamId]);

  return (
    <div
      className={twMerge(
        clsx(
          "grid grid-cols-auto/1fr grid-rows-2 gap-x-5 gap-y-2 justify-self-start border-b border-dashed border-grey-200 py-8",
          props.className,
        ),
      )}
    >
      <div className="row-span-2 size-20 overflow-hidden rounded-2xl">
        {data?.team_by_pk?.name && (
          // FIXME: Pass the correct src
          <Image src={null} teamName={data?.team_by_pk?.name} alt="Team logo" />
        )}

        {!data?.team_by_pk?.name && (
          <Skeleton className="size-full rounded-2xl" />
        )}
      </div>

      <Typography
        as="h1"
        variant={TYPOGRAPHY.H6}
        className="max-w-full self-end truncate"
      >
        {data?.team_by_pk?.name ?? <Skeleton className="max-w-[200px]" />}
      </Typography>

      <div className="grid grid-cols-auto/1fr items-center gap-x-2 self-start text-grey-500">
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
