import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type ActionAvatarProps = {
  identifier: string;
  className?: string;
};

export const ActionAvatar = (props: ActionAvatarProps) => {
  const { identifier, className } = props;

  const firstLetter = identifier.charAt(0).toUpperCase();

  return (
    <div
      className={clsx(
        "flex size-12 items-center justify-center rounded-full bg-blue-50 uppercase text-blue-500",
        className,
      )}
    >
      <Typography variant={TYPOGRAPHY.M3}>{firstLetter}</Typography>
    </div>
  );
};
