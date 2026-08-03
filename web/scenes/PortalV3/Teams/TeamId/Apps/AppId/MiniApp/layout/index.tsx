import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";

export const MiniAppLayout = (props: { children: ReactNode }) => {
  return (
    <SizingWrapper
      gridClassName="grow"
      className="mx-auto w-full max-w-[1120px]"
    >
      {props.children}
    </SizingWrapper>
  );
};
