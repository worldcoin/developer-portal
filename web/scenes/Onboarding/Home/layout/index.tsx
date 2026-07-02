import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";
import { HomeMobileNav } from "../components/HomeMobileNav";

const HOME_HEADER_LINKS = [
  {
    external: true,
    href: "https://docs.world.org",
    label: "Docs",
  },
  {
    external: true,
    href: "https://world.org/blog",
    label: "Blog",
  },
  {
    external: true,
    href: "https://world.org/world-app",
    label: "World App",
  },
] as const;

const HOME_GITHUB_LINK = {
  external: true,
  href: "https://github.com/worldcoin/developer-portal",
  label: "GitHub",
} as const;

const HOME_SIGN_IN_LINK = {
  external: false,
  href: urls.api.authLogin(),
  label: "Sign in",
} as const;

const HOME_MOBILE_NAV_LINKS = [
  ...HOME_HEADER_LINKS,
  HOME_GITHUB_LINK,
  HOME_SIGN_IN_LINK,
] as const;

const desktopNavLinkClassName =
  "hidden font-world text-[16px] leading-none tracking-[0.08em] text-black no-underline hover:underline md:inline-flex";

export const HomeLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="sticky top-0 z-20 border-b border-grey-100/70 bg-white/70 px-2 backdrop-blur-md">
        <div className="flex h-16 min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            {/* World Developers wordmark lockup. Sizing (icon, gap, clearspace
                padding, font size) is all derived from the --lockup-h variable;
                source art is 24px tall with a 14px "o" clearspace unit. */}
            <Link
              href="/"
              aria-label="World Developers"
              className="inline-flex min-w-0 items-center gap-[0.42em] whitespace-nowrap p-[calc(var(--lockup-h)*14/24)] font-world text-[length:calc(var(--lockup-h)*0.72)] leading-none text-grey-900 [--lockup-h:1.75rem]"
            >
              <WorldIcon
                aria-hidden
                className="size-[var(--lockup-h)] shrink-0 [&_path]:fill-current"
              />
              <span aria-hidden>world Developers</span>
            </Link>
            {HOME_HEADER_LINKS.map((link) => (
              <a
                className={desktopNavLinkClassName}
                href={link.href}
                key={link.label}
                rel={link.external ? "noopener noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>

          <HomeMobileNav links={HOME_MOBILE_NAV_LINKS} />

          <div className="ml-5 hidden items-center gap-3 md:flex">
            <a
              aria-label={HOME_GITHUB_LINK.label}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-black bg-transparent text-black transition-colors hover:bg-grey-50"
              href={HOME_GITHUB_LINK.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-5" />
            </a>

            <DecoratedButton
              href={HOME_SIGN_IN_LINK.href}
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

      <main className="min-w-0 overflow-x-clip">{props.children}</main>
    </div>
  );
};
