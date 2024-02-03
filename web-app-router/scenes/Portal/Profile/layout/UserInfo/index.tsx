"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/Portal/Profile/layout/UserInfo/Icon";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";
import { twMerge } from "tailwind-merge";

export type UserInfoProps = {
  name: string | undefined | null;
  email: string | undefined | null;
  className?: string;
};

export const UserInfo = (props: UserInfoProps) => {
  return (
    <div
      className={twMerge(clsx("flex items-center gap-x-5", props.className))}
    >
      <Icon name={props.name} />

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>
          {props.name ?? <Skeleton width={200} />}
        </Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {props.email ?? <Skeleton width={150} />}
        </Typography>
      </div>
    </div>
  );
};
