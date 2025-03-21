import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";

export const NotificationsLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
