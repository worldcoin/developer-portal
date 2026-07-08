import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";
import { WorldIdSubTabs } from "../SubTabs";

// Mirrors MiniAppLayout, but the World ID pages bring their own SizingWrapper,
// so `children` stays a sibling (only the tab bar is wrapped) to avoid nesting
// two sizing wrappers around the same content.
export const WorldIdLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper className="w-full">
        <div className="hidden border-b border-portal-border pt-6 md:block">
          <WorldIdSubTabs />
        </div>
      </SizingWrapper>
      {props.children}
    </div>
  );
};
