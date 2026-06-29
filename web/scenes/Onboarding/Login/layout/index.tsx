import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { WorldDevelopersLogo } from "@/components/Icons/WorldDevelopersLogo";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { ReactNode } from "react";

const LOGIN_HEADER_LINKS = [
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

const LOGIN_GITHUB_LINK = {
  external: true,
  href: "https://github.com/worldcoin/developer-portal",
  label: "GitHub",
} as const;

const LOGIN_SIGN_IN_LINK = {
  external: false,
  href: urls.api.authLogin(),
  label: "Sign in",
} as const;

const LOGIN_MOBILE_NAV_LINKS = [
  ...LOGIN_HEADER_LINKS,
  LOGIN_GITHUB_LINK,
  LOGIN_SIGN_IN_LINK,
] as const;

const desktopNavLinkClassName =
  "hidden font-world text-[16px] leading-none tracking-[0.08em] text-black no-underline hover:underline md:inline-flex";

const mobileNavLinkClassName =
  "rounded-xl px-4 py-4 no-underline hover:bg-grey-50";

export const LoginLayout = (props: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] w-full grid-rows-auto/1fr">
      <header className="sticky top-0 z-20 border-b border-grey-100/70 bg-white/70 px-2 backdrop-blur-md">
        <div className="flex h-16 min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            <Link
              href="/"
              aria-label="World Developers"
              className="inline-flex min-w-0 items-center"
            >
              <WorldDevelopersLogo />
            </Link>
            {LOGIN_HEADER_LINKS.map((link) => (
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

          <details className="group relative md:hidden">
            <summary
              aria-label="Open navigation menu"
              className="grid size-12 cursor-pointer list-none place-items-center rounded-full border border-black bg-white text-black transition-colors hover:bg-grey-50 [&::-webkit-details-marker]:hidden"
            >
              <span className="grid gap-1">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </summary>

            <nav
              aria-label="Mobile navigation"
              className="fixed inset-x-2 top-16 hidden rounded-2xl border border-grey-100 bg-white p-2 font-world text-[16px] leading-none tracking-[0.08em] text-black shadow-lg group-open:grid"
            >
              {LOGIN_MOBILE_NAV_LINKS.map((link) => (
                <a
                  className={mobileNavLinkClassName}
                  href={link.href}
                  key={link.label}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  target={link.external ? "_blank" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </details>

          <div className="ml-5 hidden items-center gap-3 md:flex">
            <a
              aria-label={LOGIN_GITHUB_LINK.label}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-black bg-transparent text-black transition-colors hover:bg-grey-50"
              href={LOGIN_GITHUB_LINK.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-5" />
            </a>

            <DecoratedButton
              href={LOGIN_SIGN_IN_LINK.href}
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
