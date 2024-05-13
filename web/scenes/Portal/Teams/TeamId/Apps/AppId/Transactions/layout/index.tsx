import { SizingWrapper } from "@/components/SizingWrapper";
import { ReactNode } from "react";

export const TransactionsLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
