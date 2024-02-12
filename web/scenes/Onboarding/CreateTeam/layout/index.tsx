import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

export const CreateTeamLayout = (props: { children: ReactNode }) => {
  return (
    <div className="w-full min-h-[100dvh] grid grid-rows-auto/1fr">
      <header className="border-b border-grey-100 py-4">
        <SizingWrapper>
          <div className="flex justify-between items-center py-2.5">
            <div className="flex items-center gap-x-1">
              <Button href="/api/auth/logout" className="flex">
                <CloseIcon />
              </Button>

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
