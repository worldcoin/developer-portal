import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldIcon } from "@/components/Icons/WorldIcon";
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
              className="group h-12 rounded-full border-black bg-transparent px-5 py-0 text-base text-black hover:border-black hover:bg-transparent hover:text-black"
              testId="log-in"
            >
              Log in
              <span className="-ml-2 inline-flex w-0 items-center justify-center overflow-hidden transition-[width,margin-left] duration-300 ease-out group-hover:ml-0 group-hover:w-6 motion-reduce:transition-none">
                <span className="inline-flex scale-0 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none">
                  <WorldIcon className="size-6 shrink-0 group-hover:animate-[spin_2.75s_linear_infinite] motion-reduce:animate-none [&_path]:fill-black" />
                </span>
              </span>
            </DecoratedButton>
          </div>
        </SizingWrapper>
      </header>

      <main>{props.children}</main>
    </div>
  );
};
