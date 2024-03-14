import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { ReactNode } from "react";

export const LoginLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="border-b border-grey-100">
        <SizingWrapper>
          <div className="flex items-center justify-between py-2.5">
            <WorldcoinIcon />

            <DecoratedButton
              href={urls.api.authLogin()}
              variant="secondary"
              className="rounded-lg"
            >
              Log in
            </DecoratedButton>
          </div>
        </SizingWrapper>
      </header>

      <main>{props.children}</main>
    </div>
  );
};

