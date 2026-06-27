import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { type ComponentProps } from "react";
import { BasePixelStrip } from "../components/BasePixelStrip";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-memberships.generated";

const LOGIN_PAGE_STYLE = `
html,
body,
main {
  overflow-x: hidden;
}

header {
  background: transparent;
  border-bottom-color: transparent !important;
  position: relative;
  z-index: 20;
}
`;

const WORLD_ID_POSTER_SRC =
  "https://images.prismic.io/worldcoin-company-website/adPKRpGXnQHGZSTS_frame1.webp?auto=format%2Ccompress&w=3840";

const WORLD_ID_VIDEO_SRC =
  "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/ad40YJ1ZCF7ETLQW_World_Website-Videos_World-ID_v2_26-04-01_optimized_260413.mp4";

const XIcon = (props: ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
    />
  </svg>
);

const RedditIcon = (props: ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0Zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614.054.295.07.602.07.91 0 2.617-3.049 4.744-6.805 4.744S5.451 17.141 5.451 14.524c0-.308.035-.615.088-.91-.61-.282-1.028-.898-1.028-1.614 0-.968.786-1.754 1.754-1.754.475 0 .898.183 1.207.491 1.207-.856 2.86-1.419 4.693-1.488l.94-4.4a.56.56 0 0 1 .665-.435l3.128.665c.214-.423.649-.719 1.158-.719ZM9.25 12.49a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm5.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm-5.466 3.99a.327.327 0 0 0-.231.558c.719.719 2.073.772 2.947.772s2.227-.053 2.946-.772a.327.327 0 0 0-.462-.462c-.452.452-1.472.58-2.484.58s-2.032-.128-2.484-.58a.326.326 0 0 0-.232-.095Z"
      fill="currentColor"
    />
  </svg>
);

const FOOTER_SOCIAL_LINKS = [
  {
    href: "https://x.com/worldcoin",
    label: "X",
    mark: "x",
  },
  {
    href: "https://github.com/worldcoin",
    label: "GitHub",
    mark: "github",
  },
  {
    href: "https://www.reddit.com/r/worldcoin/",
    label: "Reddit",
    mark: "reddit",
  },
  {
    href: "https://discord.com/invite/worldcoin",
    label: "Discord",
    mark: "discord",
  },
  {
    href: "https://www.linkedin.com/company/worldcoin/",
    label: "LinkedIn",
    mark: "in",
  },
];

const FooterSocialIcon = ({
  mark,
}: {
  mark: (typeof FOOTER_SOCIAL_LINKS)[number]["mark"];
}) => {
  if (mark === "x") {
    return <XIcon className="size-4" />;
  }

  if (mark === "github") {
    return <GithubIcon className="size-5" />;
  }

  if (mark === "reddit") {
    return <RedditIcon className="size-5" />;
  }

  if (mark === "discord") {
    return <DiscordIcon className="size-5 [&_path]:fill-current" />;
  }

  return <span className="font-gta text-[17px] font-semibold">in</span>;
};

const FOOTER_COLUMNS = [
  {
    groups: [
      {
        links: [
          { href: "https://world.org/world-id", label: "World ID" },
          { href: "https://world.org/world-app", label: "World App" },
          { href: "https://world.org/world-chain", label: "World Chain" },
          { href: "https://world.org/ecosystem", label: "Mini Apps" },
        ],
        title: "Products",
      },
      {
        links: [
          { href: "https://world.org/ecosystem", label: "Ecosystem" },
          { href: "https://world.org/community", label: "Community" },
        ],
        title: "Network",
      },
    ],
  },
  {
    groups: [
      {
        links: [
          { href: "https://docs.world.org", label: "Documentation" },
          { href: urls.api.authLogin(), label: "Dashboard" },
          { href: "https://worldscan.org", label: "Block Explorer" },
          { href: "https://github.com/worldcoin", label: "GitHub" },
        ],
        title: "Developers",
      },
      {
        links: [
          { href: "https://github.com/worldcoin/idkit", label: "IDKit" },
          { href: "https://github.com/worldcoin/minikit-js", label: "MiniKit" },
        ],
        title: "Public repos",
      },
    ],
  },
  {
    groups: [
      {
        links: [
          { href: "https://whitepaper.world.org", label: "Whitepaper" },
          { href: "https://world.org/blog", label: "Blog" },
          { href: "https://world.org/events", label: "Events" },
          { href: "https://world.org/brand", label: "Brand Guidelines" },
          { href: "https://status.world.org", label: "Status" },
        ],
        title: "Resources",
      },
    ],
  },
];

const TIMELINE_ITEMS = [
  {
    body: "Open the console, create a team, and choose the first app surface.",
    label: "01",
    title: "Start in console",
  },
  {
    body: "Use the docs to map proof requests, app IDs, and the user flow.",
    label: "02",
    title: "Read the docs",
  },
  {
    body: "Launch anonymous proof-of-human experiences across sign-in and actions.",
    label: "03",
    title: "Ship proofs",
  },
];

export const LoginPage = async () => {
  let session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (user) {
    const client = await getAPIServiceGraphqlClient();

    let membership: FetchMembershipsQuery["membership"] | null = null;

    try {
      const data = await getFetchMembershipsSdk(client).FetchMemberships({
        userId: user?.hasura?.id,
      });

      membership = data.membership;
    } catch (error) {
      logger.error(
        "Error fetching memberships on login page with active session",
        { error },
      );

      return redirect(urls.logout());
    }

    if (membership?.length > 0) {
      return redirect(urls.apps({ team_id: membership[0].team_id }));
    }

    if (membership?.length === 0) {
      return redirect(urls.createTeam());
    }
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-white text-grey-900">
      <style dangerouslySetInnerHTML={{ __html: LOGIN_PAGE_STYLE }} />

      <section
        className="relative min-h-[calc(100dvh-59px)] overflow-hidden bg-white"
        data-base-pixel-host
      >
        <BasePixelStrip />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(105deg, #ffffff 0%, rgba(255,255,255,0.98) 30%, rgba(255,255,255,0.7) 46%, rgba(255,255,255,0) 66%)",
          }}
        />

        <div className="relative z-10 px-6 pt-10 md:pt-14 lg:px-10 lg:pt-16">
          <div className="mx-auto max-w-[1180px]">
            <h1 className="max-w-[880px] font-twk text-[52px] font-medium leading-[0.94] tracking-[0] text-grey-900 sm:text-[68px] md:text-[88px] lg:text-[104px]">
              A new standard of Identity
            </h1>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-6">
          <div className="pointer-events-auto grid justify-items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <DecoratedButton
                href={urls.api.authLogin()}
                className="h-14 rounded-full border-black bg-black bg-none px-5 py-0 text-base text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] hover:border-black hover:bg-grey-900 hover:bg-none"
                icon={
                  <span className="grid size-7 place-items-center">
                    <WorldIcon className="size-6 [&_path]:fill-white" />
                  </span>
                }
              >
                Go to console
              </DecoratedButton>

              <DecoratedButton
                href="https://docs.world.org"
                variant="secondary"
                className="h-14 rounded-full border-white/70 bg-white/80 px-6 py-0 text-base shadow-[0_18px_44px_rgba(25,28,32,0.12)] backdrop-blur-md hover:bg-white"
              >
                Explore docs
              </DecoratedButton>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black px-4 py-5 text-white md:px-6 md:py-7 lg:px-10">
        <div className="relative isolate mx-auto min-h-[78vh] max-w-[1280px] overflow-hidden rounded-[28px] bg-[#050505] shadow-[inset_0_0_90px_rgba(255,255,255,0.07),0_28px_90px_rgba(0,0,0,0.32)] md:min-h-[82vh]">
          <video
            aria-label="World ID verification moment"
            autoPlay
            className="absolute inset-0 -z-10 size-full object-cover opacity-[0.72]"
            loop
            muted
            playsInline
            poster={WORLD_ID_POSTER_SRC}
          >
            <source src={WORLD_ID_VIDEO_SRC} type="video/mp4" />
          </video>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(72%_74%_at_76%_18%,rgba(0,122,255,0.28),rgba(0,0,0,0)_62%),linear-gradient(105deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.78)_38%,rgba(0,0,0,0.32)_72%,rgba(0,0,0,0.72)_100%)]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.86)]"
          />

          <div className="relative z-10 flex min-h-[78vh] flex-col justify-between gap-12 p-7 md:min-h-[82vh] md:p-10 lg:p-12">
            <div>
              <h2 className="max-w-[740px] font-twk text-[40px] font-medium leading-[0.98] tracking-[0] text-white sm:text-[48px] md:text-[68px] lg:text-[78px]">
                Anonymous Proof-of-Human
              </h2>
            </div>

            <div className="max-w-[560px]">
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <DecoratedButton
                  href="https://docs.world.org"
                  className="h-14 rounded-full border-white bg-white bg-none px-6 py-0 text-black hover:border-grey-100 hover:bg-grey-100 hover:bg-none"
                >
                  Learn more
                </DecoratedButton>

                <DecoratedButton
                  href={urls.api.authLogin()}
                  variant="secondary"
                  className="h-14 rounded-full border-white/20 bg-white/[0.08] px-6 py-0 text-white backdrop-blur-md hover:bg-white/[0.14] hover:text-white"
                >
                  Go to console
                </DecoratedButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white px-6 py-16 text-grey-900 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-14 md:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] lg:gap-20">
          <div className="grid content-start gap-5">
            <p className="font-gta text-[19px] leading-[1.35] text-grey-400">
              Build the future with World.
            </p>

            <div className="flex items-center gap-5 pt-1 text-grey-400">
              {FOOTER_SOCIAL_LINKS.map((link) => (
                <a
                  aria-label={link.label}
                  className="grid size-5 place-items-center font-gta text-[17px] font-semibold leading-none text-grey-400 transition-colors hover:text-grey-900"
                  href={link.href}
                  key={link.label}
                >
                  <FooterSocialIcon mark={link.mark} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column, columnIndex) => (
            <div className="grid content-start gap-10" key={columnIndex}>
              {column.groups.map((group) => (
                <div className="grid gap-4" key={group.title}>
                  <h2 className="font-gta text-[18px] font-semibold leading-none text-grey-900">
                    {group.title}
                  </h2>

                  <ul className="grid gap-4">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <a
                          className="font-gta text-[18px] leading-none text-grey-400 transition-colors hover:text-grey-900"
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 flex max-w-[1280px] items-center gap-6 font-gta text-sm text-grey-300">
          <span>&copy; 2026</span>

          <a
            className="text-grey-300 transition-colors hover:text-grey-900"
            href="https://world.org/legal/privacy-notice"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
};
