import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";
import { MiniAppSubTabs } from "../SubTabs";

export const MiniAppLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper variant="nav" className="w-full">
        <div className="border-b border-portal-border pt-6">
          <MiniAppSubTabs />
        </div>
        {props.children}
      </SizingWrapper>
    </div>
  );
};
