import React, { ReactNode } from "react";

export const Body = (props: { children: ReactNode }) => {
  return (
    <tbody className="bg-white divide-y divide-grey-100 overflow-y-scroll">
      {props.children}
    </tbody>
  );
};
