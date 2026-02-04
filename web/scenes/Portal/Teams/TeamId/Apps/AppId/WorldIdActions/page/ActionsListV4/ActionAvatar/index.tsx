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

  // Color scheme based on environment
  const colors =
    environment === "staging"
      ? { backgroundColor: "#F5F5F5", color: "#6B7280" } // Grey
      : { backgroundColor: "#E6F0FF", color: "#005CFF" }; // Blue

  return (
    <div
      className={clsx(
        "flex size-12 items-center justify-center rounded-full uppercase",
        className,
      )}
      style={colors}
    >
      <Typography variant={TYPOGRAPHY.M3}>{firstLetter}</Typography>
    </div>
  );
};
