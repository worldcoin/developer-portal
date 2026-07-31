import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";
import { WorldIdSubTabs } from "../SubTabs";

// Temporary shell for routes that have not moved under `/world-id` yet.
export const WorldIdCompatibilityLayout = (props: {
  children: ReactNode;
  hasLegacyActions: boolean;
}) => {
  return (
    <div>
      <SizingWrapper className="w-full">
        <div className="border-b border-portal-border pt-6">
          <WorldIdSubTabs hasLegacyActions={props.hasLegacyActions} />
        </div>
      </SizingWrapper>
      {props.children}
    </div>
  );
};
