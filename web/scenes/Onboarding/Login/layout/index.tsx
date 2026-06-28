import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldTextLogo } from "@/components/Icons/WorldTextLogo";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";

export const LoginLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="sticky top-0 z-20 border-b border-grey-100/70 bg-white/70 backdrop-blur-md">
        <SizingWrapper>
          <div className="flex items-center justify-between py-2">
            <Link
              href="/"
              aria-label="World"
              className="inline-flex items-center"
            >
              <WorldTextLogo className="h-8 w-auto" />
            </Link>

            <DecoratedButton
              href={urls.api.authLogin()}
              variant="secondary"
              className="group h-14 rounded-full rounded-full border-neutral-950 bg-neutral-950 px-6 py-0 text-base text-white shadow-[0_18px_44px_rgba(25,28,32,0.12)] backdrop-blur-md"
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
