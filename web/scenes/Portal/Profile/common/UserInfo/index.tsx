"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { getNullifierName } from "@/lib/utils";
import { useFetchUserQuery } from "@/scenes/Portal/Profile/common/graphql/client/fetch-user.generated";
import { Icon } from "@/scenes/Portal/Profile/layout/UserInfo/Icon";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";

export type UserInfoProps = {
  name?: string;
  className?: string;
};

export const UserInfo = (props: UserInfoProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const userHasura = user?.hasura;
  const userId = userHasura?.id;

  const { data } = useFetchUserQuery({
    variables: !userId ? undefined : { user_id: userId },
    context: {
      headers: { team_id: "_" },
    },
    skip: !userId,
  });

  const name = useMemo(
    () =>
      props.name ||
      data?.user?.name ||
      data?.user?.email ||
      getNullifierName(data?.user?.world_id_nullifier) ||
      "Anonymous User",
    [
      data?.user?.email,
      data?.user?.name,
      data?.user?.world_id_nullifier,
      props.name,
    ],
  );

  return (
    <div
      className={twMerge(clsx("flex items-center gap-x-5", props.className))}
    >
      <div className="leading-[0]">
        {!data?.user ? (
          <Skeleton width={72} height={72} circle={true} inline={true} />
        ) : (
          <Icon name={name} />
        )}
      </div>

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>
          {!data?.user ? <Skeleton width={200} /> : name}
        </Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {!data?.user ? <Skeleton width={200} /> : data.user.email || null}
        </Typography>
      </div>
    </div>
  );
};
