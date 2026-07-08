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

// GitHub and Sign in stay visible in the mobile header itself, so the menu
// only carries the links that collapse below md.
const HOME_MOBILE_NAV_LINKS = [...HOME_HEADER_LINKS] as const;

export const HomeLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr bg-[#f9f9f8] font-world font-[325] text-[#181818]">
      <header className="sticky top-0 z-20 bg-[#f9f9f8]/80 backdrop-blur-md">
        <div className="relative mx-auto flex h-[58px] w-full max-w-[1728px] items-center justify-between gap-4 px-4 md:px-10 xl:px-24">
          {/* World Developers wordmark lockup. Sizing (icon, gap, clearspace
              padding, font size) is all derived from the --lockup-h variable;
              source art is 24px tall with a 14px "o" clearspace unit. */}
          <Link
            href="/"
            aria-label="World Developers"
            className="inline-flex min-w-0 items-center gap-[0.42em] whitespace-nowrap py-[calc(var(--lockup-h)*14/24)] font-world text-[length:calc(var(--lockup-h)*0.72)] leading-none text-[#181818] [--lockup-h:1.25rem] md:[--lockup-h:1.5rem]"
          >
            <WorldIcon
              aria-hidden
              className="size-[var(--lockup-h)] shrink-0 [&_path]:fill-current"
            />
            <span aria-hidden>world developers</span>
          </Link>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 md:flex">
            {HOME_HEADER_LINKS.map((link) => (
              <a
                className="text-[16px] leading-[1.4] text-[#181818] no-underline hover:underline"
                href={link.href}
                key={link.label}
                rel={link.external ? "noopener noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <a
              aria-label={HOME_GITHUB_LINK.label}
              className="inline-flex h-7 items-center justify-center rounded-full border border-[#e1dfda] px-2.5 text-[#181818] transition-colors hover:bg-white md:h-10 md:px-4"
              href={HOME_GITHUB_LINK.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-4 md:size-6" />
            </a>

            <a
              className="inline-flex h-7 items-center justify-center rounded-full bg-[#181818] px-3 text-[12px] leading-[1.4] text-[#f9f9f8] transition-colors hover:bg-black md:h-10 md:px-4 md:text-[16px]"
              data-testid="log-in"
              href={HOME_SIGN_IN_LINK.href}
            >
              Sign in
            </a>

            <HomeMobileNav links={HOME_MOBILE_NAV_LINKS} />
          </div>
        </div>
      </header>

      <main className="min-w-0 overflow-x-clip">{props.children}</main>
    </div>
  );
};
