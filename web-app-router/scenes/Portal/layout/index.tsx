import { ReactNode } from "react";

export const PortalLayout = (props: { children: ReactNode }) => {
  return <div>{props.children}</div>;
};
