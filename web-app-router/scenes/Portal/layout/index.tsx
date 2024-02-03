import { urls } from "@/lib/urls";
import { ReactNode } from "react";
import { TeamSelector } from "@/scenes/Portal/layout/TeamSelector";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { Header } from "./Header";

export const PortalLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <Header />
      <div>{props.children}</div>
    </div>
  );
};
