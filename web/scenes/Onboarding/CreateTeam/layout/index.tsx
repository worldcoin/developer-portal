import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";
import { CloseButton } from "./CloseButton";

export const CreateTeamLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="max-h-[56px] border-b border-grey-100 py-4">
        <SizingWrapper>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <CloseButton />

              <span className="text-grey-200">|</span>

              <Typography variant={TYPOGRAPHY.M4}>Create a new team</Typography>
            </div>

            <LoggedUserNav />
          </div>
        </SizingWrapper>
      </header>

      <main>{props.children}</main>
    </div>
  );
};
