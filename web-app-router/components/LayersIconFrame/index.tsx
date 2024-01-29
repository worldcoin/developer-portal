import { ReactNode } from "react";

export const LayersIconFrame = (props: { children: ReactNode }) => {
  return (
    <div className="justify-self-center relative w-[120px] h-[120px] flex justify-center items-center">
      <div className="absolute inset-0 border opacity-[0.16] border-[#D9E1F6] rounded-[24px] p-2.5 shadow-[0px_4px_8px_0px_#D9E1F6]" />
      <div className="absolute inset-2.5 border border-[#D9E1F6] opacity-[0.16] rounded-20 p-2.5 shadow-[0px_4px_8px_0px_#D9E1F6]" />
      {props.children}
    </div>
  );
};
