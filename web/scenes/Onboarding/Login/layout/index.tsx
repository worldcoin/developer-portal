import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldTextLogo } from "@/components/Icons/WorldTextLogo";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";

export const LoginLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="border-b border-grey-100">
        <SizingWrapper>
          <div className="flex items-center justify-between py-2.5">
            <Link
              href="/"
              aria-label="World"
              className="inline-flex items-center"
            >
              <WorldTextLogo className="h-7 w-auto" />
            </Link>

            <DecoratedButton
              href={urls.api.authLogin()}
              variant="secondary"
              className="rounded-lg"
              testId="log-in"
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
