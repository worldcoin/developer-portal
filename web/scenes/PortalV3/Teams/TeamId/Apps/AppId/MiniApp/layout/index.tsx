import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";
import { MiniAppSubTabs } from "../SubTabs";

export const MiniAppLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper variant="nav" className="w-full">
        <div className="hidden border-b border-portal-border pt-6 md:block">
          <MiniAppSubTabs />
        </div>
        {props.children}
      </SizingWrapper>
    </div>
  );
};
