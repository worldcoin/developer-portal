"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { useFetchUserQuery } from "@/scenes/Portal/Profile/common/graphql/client/fetch-user.generated";
import { Icon } from "@/scenes/Portal/Profile/layout/UserInfo/Icon";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
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

  const userQueryRes = useFetchUserQuery({
    variables: !userId ? undefined : { user_id: userId },
    context: {
      headers: { team_id: "_" },
    },
    skip: !userId,
  });

  return (
    <div
      className={twMerge(clsx("flex items-center gap-x-5", props.className))}
    >
      <div className="leading-[0]">
        {!userQueryRes.data?.user ? (
          <Skeleton width={72} height={72} circle={true} inline={true} />
        ) : (
          <Icon name={props.name ?? userQueryRes.data?.user?.name} />
        )}
      </div>

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>
          {!userQueryRes.data?.user ? (
            <Skeleton width={200} />
          ) : (
            props.name ?? userQueryRes.data.user.name
          )}
        </Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {!userQueryRes.data?.user ? (
            <Skeleton width={200} />
          ) : (
            userQueryRes.data.user.email || null
          )}
        </Typography>
      </div>
    </div>
  );
};
