import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-memberships.generated";

const BASE_PIXEL_STRIP_SCRIPT = `
(() => {
  const roots = document.querySelectorAll("[data-base-pixel-strip]");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const WORLD_LOGO_PATH = "M10 18.333q-2.26 0-4.176-1.122a8.3 8.3 0 0 1-3.036-3.036A8.1 8.1 0 0 1 1.667 10q0-2.26 1.121-4.176a8.3 8.3 0 0 1 3.036-3.035A8.1 8.1 0 0 1 10 1.666q2.26 0 4.176 1.122a8.35 8.35 0 0 1 3.036 3.035A8.13 8.13 0 0 1 18.333 10q0 2.261-1.121 4.176a8.3 8.3 0 0 1-3.036 3.036A8.13 8.13 0 0 1 10 18.333m-7.629-7.467V9.167h15.274v1.7zM10 16.597a6.3 6.3 0 0 0 3.281-.885 6.5 6.5 0 0 0 2.36-2.394q.867-1.509.866-3.316 0-1.807-.867-3.317a6.5 6.5 0 0 0-2.359-2.393A6.3 6.3 0 0 0 10 3.406a6.3 6.3 0 0 0-3.281.886 6.53 6.53 0 0 0-2.36 2.393q-.867 1.51-.866 3.317t.866 3.316a6.5 6.5 0 0 0 2.36 2.394q1.491.885 3.281.885m-4.447-6.473v-.217q0-1.283.614-2.322a4.35 4.35 0 0 1 1.726-1.636q1.113-.597 2.54-.596h5.585l.795 1.664h-6.308q-1.41 0-2.269.813-.859.814-.86 2.079v.218q.001 1.284.86 2.088.858.803 2.27.804h6.307l-.795 1.664h-5.585q-1.428-.001-2.54-.596a4.35 4.35 0 0 1-1.726-1.636q-.614-1.04-.614-2.322z";

  roots.forEach((root, rootIndex) => {
    if (root.dataset.basePixelStripReady === "true") {
      return;
    }

    root.dataset.basePixelStripReady = "true";

    const canvas = root.querySelector("canvas");
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logoPath = typeof Path2D === "undefined" ? null : new Path2D(WORLD_LOGO_PATH);
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let cells = [];
    let grid = {
      columns: 0,
      gap: 4,
      offsetX: 0,
      offsetY: 0,
      rows: 0,
      size: 8,
      step: 12,
    };
    let logoLayout = { left: 0, size: 1, top: 0 };
    let wave = {
      coverage: 0.4,
      index: -1,
      salt: 0,
      x: 0.5,
      y: 0.5,
    };

    const random = (index, salt = 0) => {
      const value =
        Math.sin(index * 947.173 + salt * 117.31 + rootIndex * 53.91) * 10000;
      return value - Math.floor(value);
    };

    const colorForCell = (cell, lift, flash) => {
      const xMix = clamp((cell.x - logoLayout.left) / logoLayout.size, 0, 1);
      const yMix = clamp((cell.y - logoLayout.top) / logoLayout.size, 0, 1);
      const green = Math.round(136 - xMix * 58 + lift * 36 - flash * 88 - yMix * 14);
      const blue = Math.round(206 + lift * 28 + flash * 42);

      return "rgb(0, " + clamp(green, 22, 172) + ", " + clamp(blue, 202, 255) + ")";
    };

    const rebuildLogoMask = () => {
      if (!logoPath || !maskContext) {
        return null;
      }

      maskCanvas.width = width;
      maskCanvas.height = height;
      maskContext.clearRect(0, 0, width, height);

      const size = Math.min(width, height) * 0.92;

      logoLayout = {
        left: width / 2 - size / 2,
        size,
        top: height / 2 - size / 2,
      };

      maskContext.save();
      maskContext.translate(logoLayout.left, logoLayout.top);
      maskContext.scale(logoLayout.size / 20, logoLayout.size / 20);
      maskContext.fillStyle = "#000000";
      maskContext.fill(logoPath);
      maskContext.restore();

      return maskContext.getImageData(0, 0, width, height).data;
    };

    const rebuildGrid = () => {
      cells = [];
      const logoMask = rebuildLogoMask();

      const size = width < 640 ? 7 : 8;
      const gap = width < 640 ? 3 : 4;
      const step = size + gap;
      const columns = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;
      const offsetX = (width - (columns - 1) * step - size) / 2;
      const offsetY = (height - (rows - 1) * step - size) / 2;

      grid = {
        columns,
        gap,
        offsetX,
        offsetY,
        rows,
        size,
        step,
      };

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const x = offsetX + column * step;
          const y = offsetY + row * step;
          const sampleX = clamp(Math.round(x + size / 2), 0, width - 1);
          const sampleY = clamp(Math.round(y + size / 2), 0, height - 1);
          const logoAlpha = logoMask
            ? logoMask[(sampleY * width + sampleX) * 4 + 3] / 255
            : 0;

          cells.push({
            column,
            index,
            logoAlpha,
            row,
            seed: random(index),
            size,
            x,
            y,
          });
        }
      }
    };

    const updateWave = (seconds) => {
      const index = reduceMotion ? 0 : Math.floor(seconds);

      if (wave.index === index) {
        return;
      }

      wave = {
        coverage: 0.3 + random(index + 29, 7) * 0.2,
        index,
        salt: index + 1000,
        x: 0.08 + random(index + 31, 17) * 0.84,
        y: 0.2 + random(index + 37, 23) * 0.6,
      };
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      rebuildGrid();
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);

      const seconds = time / 1000;
      const progress = reduceMotion ? 0.5 : seconds - Math.floor(seconds);
      const pulse = reduceMotion
        ? 0.65
        : progress < 0.08
          ? progress / 0.08
          : progress < 0.36
            ? 1
            : clamp(1 - (progress - 0.36) / 0.16, 0, 1);
      updateWave(seconds);

      const spotlightX = wave.x * width;
      const spotlightY = wave.y * height;
      const radius = Math.max(96, Math.min(width * 0.22, 220));

      cells.forEach((cell) => {
        const centerX = cell.x + cell.size / 2;
        const centerY = cell.y + cell.size / 2;
        const logoAlpha = cell.logoAlpha;

        if (logoAlpha >= 0.08) {
          const dx = centerX - spotlightX;
          const dy = centerY - spotlightY;
          const spotlight = clamp(1 - Math.hypot(dx, dy) / radius, 0, 1);
          const isActive = random(cell.index, wave.salt) < wave.coverage;
          const flicker = reduceMotion
            ? 1
            : 0.76 + Math.sin(seconds * 45 + cell.seed * 22) * 0.18 + random(cell.index, wave.salt + 3) * 0.22;
          const texture = random(cell.index, 43) < 0.04 ? 0.55 : 1;
          const flash = isActive ? pulse * flicker * (0.62 + spotlight * 1.1) : 0;
          const intensity = clamp(
            logoAlpha *
              texture *
              (0.48 + flash),
            0,
            1,
          );

          if (intensity >= 0.04) {
            context.globalAlpha = intensity;
            context.fillStyle = colorForCell(cell, spotlight, flash);
            context.fillRect(cell.x, cell.y, cell.size, cell.size);

            context.globalAlpha = intensity * (0.14 + clamp(flash, 0, 1) * 0.24);
            context.fillStyle = "#7ff4ff";
            context.fillRect(cell.x + 1, cell.y + 1, cell.size - 2, cell.size - 2);
          }
        }
      });

      context.globalAlpha = 1;

      if (!reduceMotion) {
        window.requestAnimationFrame(draw);
      }
    };

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(root);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();
    draw();
  });
})();
`;

const LOGIN_PAGE_STYLE = `
html,
body,
main {
  overflow-x: hidden;
}

header {
  background: rgba(255, 255, 255, 0.96);
  border-bottom-color: transparent !important;
  box-shadow: 0 10px 28px rgba(25, 28, 32, 0.045);
  position: relative;
  z-index: 20;
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
    mark: "X",
  },
  {
    href: "https://github.com/worldcoin",
    label: "GitHub",
    mark: "github",
  },
  {
    href: "https://www.reddit.com/r/worldcoin/",
    label: "Reddit",
    mark: "r",
  },
  {
    href: "https://discord.com/invite/worldcoin",
    label: "Discord",
    mark: "d",
  },
  {
    href: "https://www.linkedin.com/company/worldcoin/",
    label: "LinkedIn",
    mark: "in",
  },
];

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
        <section
          aria-label="Interactive pixel field"
          className="absolute inset-0 overflow-hidden bg-white"
          data-base-pixel-strip
          suppressHydrationWarning
        >
          <canvas
            aria-hidden="true"
            className="absolute inset-0 size-full"
            suppressHydrationWarning
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(54% 58% at 50% 50%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.2) 76%, #ffffff 100%)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{
              background: "linear-gradient(to bottom, #ffffff, transparent)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-32"
            style={{
              background: "linear-gradient(to right, #ffffff, transparent)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-32"
            style={{
              background: "linear-gradient(to left, #ffffff, transparent)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
            style={{
              background: "linear-gradient(to top, #ffffff, transparent)",
            }}
          />

          <script
            dangerouslySetInnerHTML={{ __html: BASE_PIXEL_STRIP_SCRIPT }}
            id="base-pixel-strip"
          />
        </section>

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
                  {link.mark === "github" ? (
                    <GithubIcon className="size-5" />
                  ) : (
                    link.mark
                  )}
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

        <div className="mx-auto mt-20 max-w-[1280px] font-gta text-sm text-grey-300">
          &copy; 2026
        </div>
      </footer>
    </div>
  );
};
