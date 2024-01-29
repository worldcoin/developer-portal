import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Icon } from "@/scenes/Portal/Profile/layout/UserInfo/Icon";
import { ColorName } from "@/scenes/Portal/Profile/types";

export type UserInfoProps = {
  color: ColorName;
  name: string;
  email: string;
};

export const UserInfo = (props: UserInfoProps) => {
  return (
    <div className="flex items-center gap-x-5">
      <Icon color={props.color} name={props.name} />

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>{props.name}</Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {props.email}
        </Typography>
      </div>
    </div>
  );
};
