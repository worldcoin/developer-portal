import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { WorldDevelopersLogo } from "@/components/Icons/WorldDevelopersLogo";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";

export const LoginLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="sticky top-0 z-20 border-b border-grey-100/70 bg-white/70 pl-2 backdrop-blur-md">
        <div className="flex items-center justify-between py-2 pr-6 lg:pr-10">
          <div className="flex items-center gap-6 lg:gap-10">
            <Link
              href="/"
              aria-label="World Developers"
              className="inline-flex items-center"
            >
              <WorldDevelopersLogo />
            </Link>
            <a
              href="https://docs.world.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-world text-[16px] leading-none tracking-[0.08em] text-black no-underline hover:underline md:inline-flex"
            >
              Docs
            </a>
            <a
              href="https://world.org/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-world text-[16px] leading-none tracking-[0.08em] text-black no-underline hover:underline md:inline-flex"
            >
              Blog
            </a>
            <a
              href="https://world.org/world-app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-world text-[16px] leading-none tracking-[0.08em] text-black no-underline hover:underline md:inline-flex"
            >
              World App
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
                  <WorldIcon className="size-6 shrink-0 [&_path]:fill-black" />
                </span>
              </span>
            </DecoratedButton>
          </div>
        </div>
      </header>

      <main className="pl-2">{props.children}</main>
    </div>
  );
};
