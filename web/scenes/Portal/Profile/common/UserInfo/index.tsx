"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useMeQuery } from "@/scenes/common/me-query/client";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";
import { Icon } from "./Icon";

export type UserInfoProps = {
  name?: string;
  className?: string;
};

export const UserInfo = (props: UserInfoProps) => {
  const { user } = useMeQuery();

  return (
    <div
      className={twMerge(clsx("flex items-center gap-x-5", props.className))}
    >
      <div className="leading-[0]">
        {!user ? (
          <Skeleton width={72} height={72} circle={true} inline={true} />
        ) : (
          <Icon name={user.nameToDisplay} />
        )}
      </div>

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="max-w-full truncate">
          {!user ? <Skeleton width={200} /> : user.nameToDisplay}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="max-w-full truncate text-grey-500"
        >
          {!user ? <Skeleton width={200} /> : user.email || null}
        </Typography>
      </div>
    </div>
  );
};
