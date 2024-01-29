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
        <div className="leading-8 font-550 text-24">{props.name}</div>

        <div className="leading-5 text-14 text-grey-500">{props.email}</div>
      </div>
    </div>
  );
};
