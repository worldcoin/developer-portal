import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";

export const NotificationsLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper variant="nav" className="w-full">
        {props.children}
      </SizingWrapper>
    </div>
  );
};
