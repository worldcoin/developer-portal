import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { RedditIcon } from "@/components/Icons/RedditIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { XIcon } from "@/components/Icons/XIcon";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { BasePixelStrip } from "../components/BasePixelStrip";
import { DeveloperStories } from "../components/DeveloperStories";
import { HoverVideo } from "../components/HoverVideo";
import { TypingHeadline } from "../components/TypingHeadline";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-memberships.generated";

// Scoped to this page only (renders just here, not app-wide). `overflow-x:
// clip` clips horizontal overflow WITHOUT creating a scroll container, so it
// (unlike `hidden`) does not break the sticky header.
const LOGIN_PAGE_STYLE = `
html,
body,
main {
  overflow-x: clip;
}

/* Animatable angle for the product-card "shine" border sweep. */
@property --product-card-shine-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

/* A blue gradient ring that fades in and rotates on hover. The mask keeps the
   gradient to a thin border ring only (content-box vs border-box xor). */
.product-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(
    from var(--product-card-shine-angle),
    transparent 0deg,
    #4292f4 70deg,
    #bfdbfe 130deg,
    transparent 210deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.product-card:hover::before {
  opacity: 1;
  animation: product-card-shine 2.4s linear infinite;
}

@keyframes product-card-shine {
  to {
    --product-card-shine-angle: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-card:hover::before {
    animation: none;
  }
}
`;

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

const NETWORK_STATS = [
  { label: "Humans verified", value: "18M" },
  { label: "Countries using World ID", value: "68" },
  { label: "Proofs generated", value: "240M" },
];

// Product cards in the hero-adjacent showcase section. Each plays a muted
// Prismic clip on hover and has the shining border (see .product-card styles
// in LOGIN_PAGE_STYLE).
const PRODUCT_CARDS: Array<{
  href: string;
  label: string;
  poster?: string;
  video: string;
}> = [
  {
    href: "https://docs.world.org/world-id/overview",
    label: "World ID",
    poster: "/posters/World-ID-thumbnail.png",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeCqpZ1ZCF7ETPYO_Fees-Animated.mp4",
  },
  {
    href: "https://docs.world.org/world-id/idkit/integrate",
    label: "IDKit",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeIixp1ZCF7ETSvj_dithr-2026-4-14_16-17-58-1-.mp4",
  },
  {
    href: "https://docs.world.org/agents/agent-kit/integrate",
    label: "Agent Kit",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/ablVSrbci2UF6Hcw_AgentKitDither-Video-web-.mp4",
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
        className="relative min-h-[680px] overflow-hidden bg-white sm:min-h-[770px] md:min-h-[840px] lg:min-h-[880px]"
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

        <div className="relative z-10 px-4 pb-8 pt-8 md:pt-14 lg:px-6 lg:pt-16">
          <div className="mx-auto w-full max-w-[calc(100vw-32px)] lg:max-w-[calc(100vw-48px)]">
            <TypingHeadline className="max-w-[1020px] font-twk text-[48px] font-medium leading-[0.94] tracking-[0] text-grey-900 sm:text-[68px] md:text-[88px] lg:text-[104px]" />

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <DecoratedButton
                href={urls.api.authLogin()}
                className="group h-15 animate-fadeInDown rounded-full border-black bg-black bg-none px-[22px] py-0 text-base text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] [animation-delay:200ms] hover:border-black hover:bg-grey-900 hover:bg-none motion-reduce:animate-none"
                icon={
                  <span className="grid size-7 place-items-center">
                    <WorldIcon className="size-6 [&_path]:fill-white" />
                  </span>
                }
              >
                Go to console
                <span className="-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:w-6 group-hover:opacity-100 motion-reduce:transition-none">
                  <ArrowRightIcon className="size-6" />
                </span>
              </DecoratedButton>

              <DecoratedButton
                href="https://docs.world.org"
                variant="secondary"
                target="_blank"
                rel="noopener noreferrer"
                className="group h-15 animate-fadeInDown rounded-full border-black bg-transparent px-[26px] py-0 text-base text-black [animation-delay:280ms] hover:border-black hover:bg-transparent hover:text-black motion-reduce:animate-none"
              >
                Explore docs
                <span className="-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:w-6 group-hover:opacity-100 motion-reduce:transition-none">
                  <ArrowRightIcon className="size-6" />
                </span>
              </DecoratedButton>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Our network"
        className="bg-white px-4 py-6 md:px-6 md:py-8"
      >
        <div className="mx-auto w-full max-w-[calc(100vw-32px)] lg:max-w-[calc(100vw-48px)]">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {NETWORK_STATS.map((stat) => (
              <div className="text-center" key={stat.label}>
                <div className="font-twk text-[40px] font-medium leading-[0.94] tracking-[0] text-grey-900 sm:text-[68px] md:text-[88px]">
                  {stat.value}
                </div>

                <div className="mt-2 font-gta text-[13px] leading-[1.2] text-grey-400 md:mt-3 md:text-[18px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[calc(100vw-32px)] grid-cols-1 gap-4 py-4 sm:grid-cols-3 md:gap-6 lg:max-w-[calc(100vw-48px)]">
        {PRODUCT_CARDS.map(({ href, label, poster, video }) => (
          <a
            className="product-card group relative flex aspect-[3/2] cursor-pointer flex-col overflow-hidden rounded-2xl border border-black bg-white p-5 transition-[transform,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] md:p-8"
            href={href}
            key={label}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="pointer-events-none relative z-10 font-twk text-[22px] font-medium tracking-[0] text-grey-900 md:text-[26px]">
              {label}
            </span>

            <HoverVideo
              className="absolute inset-0 size-full object-cover"
              poster={poster}
              src={video}
            />
          </a>
        ))}
      </div>

      <section className="mt-4 bg-black px-2 py-2 text-white md:mt-6 md:px-3 md:py-3 lg:px-4">
        <div className="mx-auto w-full max-w-[calc(100vw-16px)] overflow-hidden rounded-[20px] bg-[#050505] shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:max-w-[1080px] md:rounded-[28px] lg:max-w-[1160px]">
          <div className="flex flex-col gap-10 p-4 md:gap-8 md:p-[52px] lg:p-[64px]">
            <DeveloperStories />
          </div>
        </div>
      </section>

      <footer className="bg-white px-4 py-10 text-grey-900 md:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] md:gap-14 lg:gap-20">
          <div className="col-span-2 grid content-start gap-5 md:col-span-1">
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
                  rel="noopener noreferrer"
                  target="_blank"
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
                    {group.links.map((link) => {
                      const isExternal = link.href.startsWith("http");

                      return (
                        <li key={link.label}>
                          <a
                            className="font-gta text-[18px] leading-none text-grey-400 transition-colors hover:text-grey-900"
                            href={link.href}
                            {...(isExternal
                              ? {
                                  rel: "noopener noreferrer",
                                  target: "_blank",
                                }
                              : {})}
                          >
                            {link.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-20 flex items-center gap-6 font-gta text-sm text-grey-300">
          <span>&copy; 2026</span>

          <a
            className="text-grey-300 transition-colors hover:text-grey-900"
            href="https://world.org/legal/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
};
