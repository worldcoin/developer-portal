import { SizingWrapper } from "@/components/SizingWrapper";
import type { ReactNode } from "react";

export const ProfilePageFrame = (props: {
  children: ReactNode;
  busy?: boolean;
}) => {
  return (
    <SizingWrapper gridClassName="pb-28">
      <main
        className="w-full max-w-[800px] pt-6"
        aria-busy={props.busy || undefined}
      >
        <h1 className="font-twk text-19 leading-[1.2] font-[550] tracking-[-0.19px] text-portal-ink">
          Profile
        </h1>

        {props.children}
      </main>
    </SizingWrapper>
  );
};

export const ProfileSectionDivider = () => (
  <hr className="my-10 border-0 border-t border-portal-border" />
);
