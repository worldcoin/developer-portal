import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { redirect } from "next/navigation";
import { ComponentType } from "react";
import { BasePixelStrip } from "../components/BasePixelStrip";
import { DeveloperStories } from "../components/DeveloperStories";
import { HoverVideo } from "../components/HoverVideo";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-memberships.generated";
import { getNetworkStats } from "./server/get-network-stats";

type IconProps = { className?: string };

const HEADLINE_LINE_1 = "A new standard";
const HEADLINE_LINE_2 = "of identity";
const HEADLINE_TYPING_MS_PER_CHAR = 70;
const HEADLINE_LINE_1_S =
  (HEADLINE_LINE_1.length * HEADLINE_TYPING_MS_PER_CHAR) / 1000;
const HEADLINE_LINE_2_S =
  (HEADLINE_LINE_2.length * HEADLINE_TYPING_MS_PER_CHAR) / 1000;

// Pure-CSS typing reveal for the two-line hero headline. A hidden ghost
// (::after) sizes each grid cell to the full phrase so the overlay can animate
// width 0→100% in per-character steps; the caret is a right border that blinks
// on line 1 while it types, then hands off to line 2 exactly when line 1
// completes.
const TYPING_HEADLINE_STYLE = `
.typing-headline-wrap {
  display: inline-grid;
  vertical-align: top;
  max-width: 100%;
  overflow: visible;
}

.typing-headline-wrap::after {
  content: attr(data-text);
  visibility: hidden;
  grid-area: 1 / 1;
  white-space: nowrap;
  pointer-events: none;
  padding-right: 0.15em;
}

.typing-headline {
  grid-area: 1 / 1;
  overflow-x: clip;
  overflow-y: visible;
  white-space: nowrap;
  width: 0;
  min-width: 0;
  border-right: 0.075em solid currentColor;
}

.typing-headline__text {
  display: inline-block;
  padding-right: 0.15em;
}

.typing-headline--line1 {
  animation:
    typing-headline-reveal ${HEADLINE_LINE_1_S}s steps(${HEADLINE_LINE_1.length}, end) forwards,
    typing-headline-caret 0.8s step-end infinite,
    typing-headline-caret-off 0s linear ${HEADLINE_LINE_1_S}s forwards;
}

.typing-headline--line2 {
  border-right-color: transparent;
  animation:
    typing-headline-reveal ${HEADLINE_LINE_2_S}s steps(${HEADLINE_LINE_2.length}, end) ${HEADLINE_LINE_1_S}s forwards,
    typing-headline-caret 0.8s step-end ${HEADLINE_LINE_1_S}s infinite;
}

@keyframes typing-headline-reveal {
  to {
    width: 100%;
  }
}

@keyframes typing-headline-caret {
  0% {
    border-right-color: currentColor;
  }
  50% {
    border-right-color: transparent;
  }
  100% {
    border-right-color: currentColor;
  }
}

@keyframes typing-headline-caret-off {
  to {
    border-right-color: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-headline {
    width: 100%;
    animation: none !important;
    border-right-color: transparent !important;
  }
}
`;

const HumanBadgeIcon = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.1164 9.31432C16.4291 9.31433 16.7745 9.61719 16.7746 10.0321C16.7746 10.447 16.4291 10.7498 16.1164 10.7499C15.8035 10.7499 15.4582 10.4472 15.4582 10.0321C15.4584 9.61714 15.8037 9.31432 16.1164 9.31432Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2.67"
    />
    <path
      d="M16.0741 16.5481L15.4736 16.1526L11.2109 13.344L15.4159 16.054L16.1396 16.5198L16.8622 16.054L21.1152 13.3118L16.7275 16.2044L16.1269 16.5999V22.6887H16.0741V16.5481Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2.67"
    />
    <path
      d="M16.105 29.3836C14.3018 29.3836 12.5517 29.0303 10.9034 28.3329C9.31209 27.6598 7.88323 26.6967 6.65659 25.4701C5.42994 24.2434 4.46659 22.8145 3.79373 21.2232C3.09664 19.575 2.74331 17.8248 2.74331 16.0217C2.74331 14.2185 3.09664 12.4683 3.79403 10.8201C4.46718 9.22871 5.43025 7.79985 6.65689 6.57321C7.88352 5.34658 9.31237 4.38321 10.9038 3.71035C12.552 3.01327 14.3018 2.65993 16.105 2.65993C17.9082 2.65993 19.6583 3.01327 21.3065 3.71066C22.8979 4.38381 24.3268 5.34687 25.5535 6.57351C26.7801 7.80016 27.7435 9.22907 28.4163 10.8204C29.1133 12.4686 29.467 14.2185 29.467 16.0219C29.467 17.8254 29.1137 19.5753 28.4163 21.2235C27.7431 22.8148 26.7801 24.2437 25.5535 25.4704C24.3268 26.697 22.8979 27.6603 21.3065 28.3332C19.6583 29.0303 17.9085 29.3836 16.105 29.3836ZM16.105 5.34029C13.2517 5.34029 10.5696 6.45145 8.55189 8.46882C6.53452 10.4862 5.42336 13.1686 5.42336 16.0219C5.42336 18.8752 6.53452 21.5574 8.55189 23.575C10.5692 25.5924 13.2517 26.7035 16.105 26.7035C18.9583 26.7035 21.6404 25.5924 23.6581 23.575C25.6755 21.5577 26.7867 18.8752 26.7867 16.0219C26.7867 13.1686 25.6755 10.4865 23.6581 8.46882C21.6408 6.45145 18.9583 5.34029 16.105 5.34029Z"
      fill="currentColor"
    />
  </svg>
);

const ViewGridIcon = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.3575 6.33822C13.3575 5.78593 12.9098 5.33822 12.3575 5.33822H6.33333C5.78105 5.33822 5.33333 5.78593 5.33333 6.33822V12.401C5.33333 12.9533 5.78105 13.401 6.33333 13.401H12.3575C12.9098 13.401 13.3575 12.9533 13.3575 12.401V6.33822Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeWidth="2.67"
    />
    <path
      d="M26.6671 6.33814C26.6671 5.78585 26.2193 5.33814 25.6671 5.33814H19.649C19.0968 5.33814 18.649 5.78585 18.649 6.33814V12.3947C18.649 12.947 19.0968 13.3947 19.649 13.3947H25.6671C26.2193 13.3947 26.6671 12.947 26.6671 12.3947V6.33814Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeWidth="2.67"
    />
    <path
      d="M13.2465 19.7285C13.2465 19.1762 12.7987 18.7285 12.2465 18.7285H6.35807C5.80579 18.7285 5.35807 19.1762 5.35807 19.7285V25.6549C5.35807 26.2072 5.80579 26.6549 6.35807 26.6549H12.2465C12.7987 26.6549 13.2465 26.2072 13.2465 25.6549V19.7285Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeWidth="2.67"
    />
    <path
      d="M26.6548 19.7286C26.6548 19.1763 26.207 18.7286 25.6548 18.7286H19.7499C19.1976 18.7286 18.7499 19.1763 18.7499 19.7286V25.6715C18.7499 26.2238 19.1976 26.6715 19.7499 26.6715H25.6548C26.207 26.6715 26.6548 26.2238 26.6548 25.6715V19.7286Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeWidth="2.67"
    />
  </svg>
);

const CursorPointerIcon = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M26.0036 13.2928C27.6098 13.945 27.4872 16.2589 25.8211 16.7378L17.414 19.1544L13.5742 27.0142C12.8133 28.5717 10.5133 28.2906 10.1499 26.5957L6.2357 8.34194C5.92851 6.90939 7.34947 5.71706 8.70692 6.26834L26.0036 13.2928Z"
      fillRule="evenodd"
      stroke="currentColor"
      strokeWidth="2.67"
    />
  </svg>
);

// L-shaped connector for the nested blog links in the footer.
const NestedLinkConnector = () => (
  <svg
    aria-hidden="true"
    className="mt-0.5 size-3 shrink-0"
    fill="none"
    viewBox="0 0 12.5 12.5"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0.5 0V12H12.5" stroke="#E1DFDA" />
  </svg>
);

// Developer tool cards. Each card keeps the hover-to-play background video from
// the previous landing page: the muted Prismic clip fades in and plays while
// the pointer is over the card (see HoverVideo). The card content must stay
// `pointer-events-none` so the video element receives the hover events.
const DEVELOPER_TOOL_CARDS: Array<{
  description: string;
  href: string;
  icon: ComponentType<IconProps>;
  label: string;
  poster?: string;
  video: string;
}> = [
  {
    description:
      "Verify unique humans while preserving privacy. Add proof of human to your app, platform, or protocol.",
    href: "https://docs.world.org/world-id/overview",
    icon: HumanBadgeIcon,
    label: "World ID",
    poster: "/posters/World-ID-thumbnail.png",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeCqpZ1ZCF7ETPYO_Fees-Animated.mp4",
  },
  {
    description:
      "A simple integration toolkit for adding World ID verification flows to web and mobile experiences.",
    href: "https://docs.world.org/world-id/idkit/integrate",
    icon: ViewGridIcon,
    label: "IDKit",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/aeIixp1ZCF7ETSvj_dithr-2026-4-14_16-17-58-1-.mp4",
  },
  {
    description:
      "Build AI agents that can interact with verified humans and take trusted actions across digital environments.",
    href: "https://docs.world.org/agents/agent-kit/integrate",
    icon: CursorPointerIcon,
    label: "Agent Kit",
    video:
      "https://worldcoin-company-website.cdn.prismic.io/worldcoin-company-website/ablVSrbci2UF6Hcw_AgentKitDither-Video-web-.mp4",
  },
];

type FooterLink = { href: string; label: string; nested?: boolean };

const FOOTER_LINK_COLUMNS: FooterLink[][] = [
  [
    { href: "https://world.org/world-id", label: "World ID" },
    { href: "https://world.org/world-app", label: "World App" },
    { href: "https://world.org/world-chain", label: "World Chain" },
    { href: "https://world.org/ecosystem", label: "Mini Apps" },
  ],
  [
    { href: "https://world.org/about", label: "About World" },
    { href: "https://world.org/flagships", label: "World Flagships" },
    { href: "https://world.org/blog", label: "World Blogs" },
    {
      href: "https://world.org/blog?blog_type=world-view",
      label: "World View",
      nested: true,
    },
    {
      href: "https://world.org/blog?blog_type=world-tech",
      label: "World Tech",
      nested: true,
    },
  ],
  [
    { href: "https://world.org/ecosystem", label: "Ecosystem" },
    { href: "https://world.org/community", label: "Community" },
  ],
  [
    { href: "https://docs.world.org", label: "Documentation" },
    { href: urls.api.authLogin(), label: "Dashboard" },
    { href: "https://worldscan.org", label: "Block Explorer" },
    { href: "https://github.com/worldcoin", label: "GitHub" },
  ],
  [
    { href: "https://github.com/worldcoin/idkit", label: "IDKit" },
    { href: "https://github.com/worldcoin/minikit-js", label: "MiniKit" },
  ],
  [
    { href: "https://whitepaper.world.org", label: "Whitepaper" },
    { href: "https://world.org/events", label: "Events" },
    { href: "https://world.org/brand", label: "Brand Guidelines" },
    { href: "https://status.world.org", label: "Status" },
  ],
];

const FOOTER_SOCIAL_LINKS: FooterLink[] = [
  { href: "https://x.com/worldnetwork", label: "X" },
  { href: "https://github.com/worldcoin", label: "Github" },
  {
    href: "https://whatsapp.com/channel/0029VasfcwXA89MkWpeNDB41",
    label: "WhatsApp",
  },
  { href: "https://discord.com/invite/worldcoin", label: "Discord" },
  { href: "https://t.me/worldnetworkofficial", label: "Telegram" },
  { href: "https://youtube.com/@worldnetworkofficial", label: "YouTube" },
  { href: "https://instagram.com/world", label: "Instagram" },
  { href: "https://tiktok.com/@worldnetwork", label: "TikTok" },
  { href: "https://www.reddit.com/r/worldid", label: "Reddit" },
  { href: "https://linkedin.com/company/worldofficial", label: "LinkedIn" },
];

const FOOTER_LEGAL_LINKS: FooterLink[] = [
  { href: "https://world.org/legal/cookie-policy", label: "Cookie Policy" },
  { href: "https://world.org/legal/privacy-notice", label: "Privacy Notice" },
  { href: "https://world.org/trademark", label: "Trademark Policy" },
  {
    href: "https://www.toolsforhumanity.com/legal/law-enforcement-requests",
    label: "Data Requests",
  },
  {
    href: "https://world.org/legal/user-terms-and-conditions",
    label: "User Terms",
  },
  { href: "https://world.org/risks", label: "Risks" },
  {
    href: "https://secure.ethicspoint.com/domain/media/en/gui/93581/index.html",
    label: "Community Alerts",
  },
];

const CONTAINER_CLASS = "mx-auto w-full max-w-[1728px] px-4 md:px-10 xl:px-24";

const isExternalHref = (href: string) => href.startsWith("http");

const externalLinkProps = (href: string) =>
  isExternalHref(href) ? { rel: "noopener noreferrer", target: "_blank" } : {};

export const HomePage = async () => {
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
        "Error fetching memberships on home page with active session",
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

  const networkStats = await getNetworkStats();

  return (
    <div className="min-h-full bg-[#f9f9f8] font-world font-[325] text-[#181818]">
      <style dangerouslySetInnerHTML={{ __html: TYPING_HEADLINE_STYLE }} />

      <section className={CONTAINER_CLASS}>
        <div className="grid items-center gap-12 pb-[160px] pt-20 md:pt-16 lg:grid-cols-2 lg:gap-0 lg:pb-[100px] lg:pt-[102px]">
          <div className="flex max-w-[680px] flex-col items-start gap-10 lg:gap-16">
            <div className="flex flex-col gap-4">
              <h1 className="text-[clamp(44px,4.6vw,80px)] leading-[1.1] tracking-[-0.02em]">
                <span
                  className="typing-headline-wrap"
                  data-text={HEADLINE_LINE_1}
                >
                  <span className="typing-headline typing-headline--line1">
                    <span className="typing-headline__text">
                      {HEADLINE_LINE_1}
                    </span>
                  </span>
                </span>
                <br />
                <span
                  className="typing-headline-wrap"
                  data-text={HEADLINE_LINE_2}
                >
                  <span className="typing-headline typing-headline--line2">
                    <span className="typing-headline__text">
                      {HEADLINE_LINE_2}
                    </span>
                  </span>
                </span>
              </h1>

              <p className="max-w-[680px] text-[clamp(24px,2.2vw,38px)] leading-[1.3] tracking-[-0.02em]">
                World gives developers the tools to build apps, agents, and
                digital experiences that can verify real people privately and
                securely.
              </p>
            </div>

            <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#181818] px-5 py-3 text-[18px] leading-[1.4] text-[#f9f9f8] transition-colors hover:bg-black sm:px-8 sm:py-4 sm:text-[22px]"
                href={urls.api.authLogin()}
              >
                Go to console
                <span className="-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:w-7 group-hover:opacity-100 motion-reduce:transition-none">
                  <ArrowRightIcon className="size-7" />
                </span>
              </a>

              <a
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#181818] px-5 py-3 text-[18px] leading-[1.4] text-[#181818] transition-colors hover:bg-[#181818]/5 sm:px-8 sm:py-4 sm:text-[22px]"
                href="https://docs.world.org"
                rel="noopener noreferrer"
                target="_blank"
              >
                Explore docs
                <span className="-ml-2 flex w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:w-7 group-hover:opacity-100 motion-reduce:transition-none">
                  <ArrowRightIcon className="size-7" />
                </span>
              </a>
            </div>
          </div>

          <div className="relative aspect-[756/700] w-full lg:aspect-auto lg:h-[700px]">
            <BasePixelStrip />
          </div>
        </div>
      </section>

      <section aria-label="Our network" className={CONTAINER_CLASS}>
        <div className="grid gap-3 md:grid-cols-3 md:gap-6">
          {networkStats.map((stat) => (
            <div
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#edece9] bg-white p-6 md:p-8"
              key={stat.label}
            >
              <p className="text-[16px] leading-[1.4]">{stat.label}</p>

              <p className="text-[clamp(38px,3.7vw,64px)] leading-[1.1] tracking-[-0.02em]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${CONTAINER_CLASS} mt-[160px] lg:mt-[220px]`}>
        <div className="flex flex-col gap-10">
          <div className="flex max-w-[625px] flex-col gap-4">
            <h2 className="text-[clamp(30px,2.8vw,48px)] leading-[1.2] tracking-[-0.02em]">
              Developer tools
            </h2>

            <p className="text-[18px] leading-[1.4] md:text-[20px]">
              Use World&apos;s developer tools to integrate proof of human,
              enable verified actions, and create experiences for real users
              across the World network.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 md:gap-6">
            {DEVELOPER_TOOL_CARDS.map(
              ({ description, href, icon: Icon, label, poster, video }) => (
                <a
                  className="group relative flex min-h-[300px] flex-col justify-between gap-10 overflow-hidden rounded-2xl border border-[#edece9] bg-white p-6 md:min-h-[340px] md:p-8"
                  href={href}
                  key={label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <HoverVideo
                    className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none"
                    poster={poster}
                    src={video}
                  />

                  <Icon className="pointer-events-none relative z-10 size-6 md:size-8" />

                  <span className="pointer-events-none relative z-10 flex flex-col gap-2 md:gap-3">
                    <span className="text-[24px] leading-[1.3] tracking-[-0.48px] md:text-[32px] md:tracking-[-0.64px]">
                      {label}
                    </span>

                    <span className="flex flex-col items-start gap-6">
                      <span className="text-[18px] leading-[1.4] md:text-[20px]">
                        {description}
                      </span>

                      <span className="hidden text-[20px] leading-[1.4] underline md:inline">
                        Explore
                      </span>
                    </span>
                  </span>
                </a>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={`${CONTAINER_CLASS} mt-[160px] lg:mt-[180px]`}>
        <DeveloperStories />
      </section>

      <footer className="mt-[160px] bg-[#f3f2f0] lg:mt-[200px]">
        <div className={`${CONTAINER_CLASS} py-16`}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:flex lg:items-start lg:justify-between">
            {FOOTER_LINK_COLUMNS.map((column, columnIndex) => (
              <ul className="flex flex-col gap-2" key={columnIndex}>
                {column.map((link) => (
                  <li key={link.label}>
                    <a
                      className="flex items-start gap-1 text-[16px] leading-[1.4] transition-colors hover:text-[#75726f]"
                      href={link.href}
                      {...externalLinkProps(link.href)}
                    >
                      {link.nested ? <NestedLinkConnector /> : null}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          <div className="mt-14 border-t border-[#e1dfda] pt-8">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              {FOOTER_SOCIAL_LINKS.map((link) => (
                <a
                  className="text-[16px] leading-[1.4] transition-colors hover:text-[#75726f]"
                  href={link.href}
                  key={link.label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-16 flex max-w-[854px] flex-col gap-3 text-[12px] leading-[1.4] text-[#9d9b96]">
            <p>
              *Since token launched on July 24, 2023, i.e., excluding activity
              during beta phase of project.
            </p>

            <p>
              ***Eligibility for Worldcoin (WLD) tokens is restricted based on
              geography, age, and other factors. WLD is not available for
              distribution via{" "}
              <a
                className="text-[#75726f] underline"
                href="https://world.org/world-app"
                rel="noopener noreferrer"
                target="_blank"
              >
                World App
              </a>{" "}
              to people, companies or organizations who are residents of, or are
              located or incorporated in the State of New York or other
              restricted territories. World Assets, Ltd. and World Foundation
              are not responsible for the availability of WLD on third party
              platforms, such as centralized or decentralized exchanges. For
              details, go to:{" "}
              <a
                className="text-[#75726f] underline"
                href="https://world.org/legal/user-terms-and-conditions"
                rel="noopener noreferrer"
                target="_blank"
              >
                https://world.org/legal/user-terms-and-conditions
              </a>
              . Crypto products can be highly risky. Important User Information
              can be found at{" "}
              <a
                className="text-[#75726f] underline"
                href="https://world.org/risks"
                rel="noopener noreferrer"
                target="_blank"
              >
                https://world.org/risks
              </a>
              .
            </p>
          </div>

          <div className="mt-10 border-t border-[#e1dfda] pt-8">
            <div className="flex flex-col gap-4 text-[12px] leading-[1.4] md:flex-row md:items-center md:justify-between">
              <span>&trade; 2026 World</span>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {FOOTER_LEGAL_LINKS.map((link) => (
                  <a
                    className="transition-colors hover:text-[#75726f]"
                    href={link.href}
                    key={link.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
