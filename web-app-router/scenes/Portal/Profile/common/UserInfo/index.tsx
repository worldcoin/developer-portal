"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/Portal/Profile/layout/UserInfo/Icon";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useFetchUserQuery } from "@/scenes/Portal/Profile/common/graphql/client/fetch-user.generated";

export type UserInfoProps = {
  name?: string;
  //email: string | undefined | null;
  className?: string;
};

export const UserInfo = (props: UserInfoProps) => {
  const { user } = useUser();
  const userHasura = user?.hasura as { id: string } | undefined;
  const userId = userHasura?.id;

  const userQueryRes = useFetchUserQuery({
    variables: !userId ? undefined : { user_id: userId },
    context: {
      headers: { team_id: "team_b0b7af3f49ea4b6106332f7b6dd5b708___" },
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
          {!userQueryRes.data?.user ? <Skeleton width={200} /> : user!.email}
        </Typography>
      </div>
    </div>
  );
};
