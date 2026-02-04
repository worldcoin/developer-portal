"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type ActionAvatarProps = {
  identifier: string;
  environment: "staging" | "production";
  className?: string;
};

export const ActionAvatar = (props: ActionAvatarProps) => {
  const { identifier, environment, className } = props;

  const firstLetter = identifier.charAt(0).toUpperCase();

  const bgClass = environment === "staging" ? "bg-grey-50" : "bg-blue-50";
  const textClass =
    environment === "staging" ? "text-grey-500" : "text-blue-500";

  return (
    <div
      className={clsx(
        "flex size-12 items-center justify-center rounded-full uppercase",
        bgClass,
        textClass,
        className,
      )}
    >
      <Typography variant={TYPOGRAPHY.M3}>{firstLetter}</Typography>
    </div>
  );
};
