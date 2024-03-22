import { ReactNode } from "react";

export const Body = (props: { children: ReactNode }) => {
  return (
    <div className="divide-y divide-grey-100 overflow-y-scroll bg-white">
      {props.children}
    </div>
  );
};
