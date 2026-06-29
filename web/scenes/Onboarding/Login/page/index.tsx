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

const WORLD_ID_POSTER_SRC =
  "https://images.prismic.io/worldcoin-company-website/adPKRpGXnQHGZSTS_frame1.webp?auto=format%2Ccompress&w=3840";

const WORLD_ID_VIDEO_SRC =
  "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/ad40YJ1ZCF7ETLQW_World_Website-Videos_World-ID_v2_26-04-01_optimized_260413.mp4";

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
  label: string;
  poster?: string;
  video: string;
}> = [
  {
    label: "World ID",
    poster: "/posters/World-ID-thumbnail.png",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeCqpZ1ZCF7ETPYO_Fees-Animated.mp4",
  },
  {
    label: "IDKit",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeIixp1ZCF7ETSvj_dithr-2026-4-14_16-17-58-1-.mp4",
  },
  {
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
        className="relative min-h-[calc(100dvh-55px)] overflow-hidden bg-white"
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
            <TypingHeadline className="max-w-[880px] font-twk text-[52px] font-medium leading-[0.94] tracking-[0] text-grey-900 sm:text-[68px] md:text-[88px] lg:text-[104px]" />

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

      <section className="bg-white px-4 pb-12 pt-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PRODUCT_CARDS.map(({ label, poster, video }) => (
              <div
                className="product-card group relative flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border border-black bg-white p-6 md:p-8"
                key={label}
              >
                <span className="pointer-events-none relative z-10 font-twk text-[22px] font-medium tracking-[0] text-grey-900 md:text-[26px]">
                  {label}
                </span>

                <HoverVideo
                  className="absolute inset-0 size-full object-cover"
                  poster={poster}
                  src={video}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-2 py-5 text-white md:px-3 md:py-7 lg:px-4">
        <div className="relative isolate mx-auto max-w-[1600px] overflow-hidden rounded-[28px] bg-[#050505] shadow-[inset_0_0_90px_rgba(255,255,255,0.07),0_28px_90px_rgba(0,0,0,0.32)] md:min-h-[82vh]">
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

          <div className="relative z-10 flex flex-col gap-10 p-7 md:min-h-[82vh] md:justify-between md:gap-12 md:p-10 lg:p-12">
            <div>
              <h2 className="text-center font-twk text-[40px] font-medium leading-[0.98] tracking-[0] text-white sm:text-[48px] md:text-[68px] lg:text-[78px]">
                Developer Stories
              </h2>
            </div>

            <DeveloperStories />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-8 md:py-10 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-center font-twk text-[28px] font-medium tracking-[0] text-grey-900 sm:text-[32px] md:text-[36px]">
            Our Network
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-3 md:mt-8">
            {NETWORK_STATS.map((stat) => (
              <div className="text-center" key={stat.label}>
                <div className="font-twk text-[56px] font-medium leading-[0.94] tracking-[0] text-grey-900 sm:text-[68px] md:text-[88px]">
                  {stat.value}
                </div>

                <div className="mt-3 font-gta text-[16px] leading-[1.3] text-grey-400 md:text-[18px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white px-6 py-16 text-grey-900 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] md:gap-14 lg:gap-20">
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
