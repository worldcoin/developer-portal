import { ReactNode } from "react";
import { TeamSelector } from "@/scenes/Portal/layout/TeamSelector";

export const PortalLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <header>
        <TeamSelector />
      </header>

      <div>{props.children}</div>
    </div>
  );
};
