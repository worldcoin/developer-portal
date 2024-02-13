import { ReactNode } from "react";

export const Body = (props: { children: ReactNode }) => {
  return (
    <tbody className="divide-y divide-grey-100 overflow-y-scroll bg-white">
      {props.children}
    </tbody>
  );
};
