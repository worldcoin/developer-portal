import { ReactNode } from "react";

export const LayersIconFrame = (props: { children: ReactNode }) => {
  return (
    <div className="relative flex size-[120px] items-center justify-center justify-self-center">
      <div className="absolute inset-0 rounded-[24px] border border-[#D9E1F6] p-2.5 opacity-[0.16] shadow-[0px_4px_8px_0px_#D9E1F6]" />
      <div className="absolute inset-2.5 rounded-20 border border-[#D9E1F6] p-2.5 opacity-[0.16] shadow-[0px_4px_8px_0px_#D9E1F6]" />
      {props.children}
    </div>
  );
};
