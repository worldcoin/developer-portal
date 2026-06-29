import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
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
            <div className="-ml-[64px] flex items-center gap-10">
              <Link
                href="/"
                aria-label="World"
                className="inline-flex items-center"
              >
                <WorldTextLogo className="h-8 w-auto" />
              </Link>
              <a
                href="https://docs.world.org"
                className="font-world text-[16px] leading-none tracking-[0.08em] text-base text-black no-underline hover:underline"
              >
                Docs
              </a>
              <a
                href="https://world.org/blog"
                className="font-world text-[16px] leading-none tracking-[0.08em] text-base text-black no-underline hover:underline"
              >
                Blog
              </a>
            </div>
            <div className="ml-5 flex items-center gap-3">
              <a
                aria-label="GitHub"
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-black bg-transparent text-black transition-colors hover:bg-grey-50"
                href="https://github.com/worldcoin/developer-portal"
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubIcon className="size-5" />
              </a>

              <DecoratedButton
                href={urls.api.authLogin()}
                variant="secondary"
                className="group h-12 rounded-full border-black bg-transparent px-5 py-0 text-base text-black hover:border-black hover:bg-white hover:text-black"
                testId="log-in"
              >
                Sign in
                <span className="-ml-2 inline-flex w-0 items-center justify-center overflow-hidden transition-[width,margin-left] duration-300 ease-out group-hover:ml-0 group-hover:w-6 motion-reduce:transition-none">
                  <span className="inline-flex scale-0 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none">
                    <WorldIcon className="size-6 shrink-0 animate-[spin_2.75s_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running] motion-reduce:animate-none [&_path]:fill-black" />
                  </span>
                </span>
              </DecoratedButton>
            </div>
          </div>
        </SizingWrapper>
      </header>

      <main>{props.children}</main>
    </div>
  );
};
