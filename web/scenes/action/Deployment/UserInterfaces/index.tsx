import cn from "classnames";
import { Dispatch, Fragment, memo, ReactNode, SetStateAction } from "react";
import { InterfaceButton } from "./InterfaceButton";
import { text } from "common/styles";
import { IconType } from "common/Icon";
import { UserInterfacesType } from "types";

export type UserInterfaceTabType = {
  content?: ReactNode;
  description: string;
  disabled?: boolean;
  icon: IconType;
  key: UserInterfacesType;
  title: string;
};

export const UserInterfaces = memo(function UserInterfaces<
  T extends UserInterfacesType
>(props: {
  className?: string;
  tabs: Array<UserInterfaceTabType>;
  enabledInterfaces?: Array<UserInterfacesType>;
  currentTab?: T | null;
  onChangeTab: Dispatch<SetStateAction<UserInterfacesType>>;
}) {
  return (
    <div className={cn("grid gap-y-4", props.className)}>
      <span className={cn(text.h2)}>Select a user interface</span>

      <div className="grid lg:grid-cols-3 gap-x-8 gap-y-4">
        {props.tabs.map(({ key, title, description, disabled, icon }) => (
          <InterfaceButton
            description={description}
            disabled={disabled}
            selected={props.currentTab === key}
            enabled={props.enabledInterfaces?.includes(key)}
            icon={icon}
            key={key}
            title={title}
            value={key}
            changeSection={props.onChangeTab}
          />
        ))}
      </div>

      <div className="grid gap-y-8">
        {props.tabs
          .filter(
            (tab) =>
              tab.content && !tab.disabled && props.currentTab === tab.key
          )
          .map(({ key, content }) => (
            <Fragment key={key}>{content}</Fragment>
          ))}
      </div>
    </div>
  );
});
