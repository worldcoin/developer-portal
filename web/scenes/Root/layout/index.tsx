import PostHogPageView from "@/scenes/Root/providers/PostHogPageView";
import WithPostHogIdentifier from "@/scenes/Root/providers/providers";
import "@/styles/globals.css";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import { IBM_Plex_Mono, Rubik } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Suspense } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Slide, ToastContainer } from "react-toastify";

const rubik = Rubik({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-rubik-source",
  weight: ["400"],
});

const ibmPlexMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  style: ["normal"],
  variable: "--font-mono-source",
  weight: ["400", "600"],
});

const gtAmerica = localFont({
  display: "swap",
  src: [
    {
      path: "../../../app/fonts/GTAmerica-Rg.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "../../../app/fonts/GTAmerica-RgIt.woff2",
      style: "italic",
      weight: "400",
    },
    {
      path: "../../../app/fonts/GT-America-Md.woff2",
      style: "normal",
      weight: "500",
    },
  ],
  variable: "--font-gta-source",
});

const twkLausanne = localFont({
  display: "swap",
  src: "../../../app/fonts/TWKLausanne-550.woff2",
  variable: "--font-twk-source",
  weight: "500",
});

// WorldProMVP.ttf is a variable font whose real wght axis is 300–800 (default
// 300). Declaring "100 900" advertised a range the file doesn't have, so weight
// requests outside 300–800 clamped and the mapping didn't match Figma. Declare
// the true axis so `font-[325]`, medium, semibold, etc. all resolve correctly.
const worldPro = localFont({
  display: "swap",
  src: "../../../app/fonts/WorldProMVP.ttf",
  variable: "--font-world-source",
  weight: "300 800",
});

const fontVariables = [
  rubik.variable,
  ibmPlexMono.variable,
  gtAmerica.variable,
  twkLausanne.variable,
  worldPro.variable,
].join(" ");

export const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  // Force request-time rendering so Next can apply the per-request CSP nonce
  // from `web/proxy.ts` to framework and page scripts.
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-current-path");
  const disableUserIdentification =
    currentPath === "/admin" || currentPath?.startsWith("/admin/");
  // next-themes injects an inline script that applies the stored theme before
  // first paint; it needs the per-request CSP nonce to pass `web/proxy.ts`.
  const cspNonce = requestHeaders.get("x-nonce") ?? undefined;

  // suppressHydrationWarning: next-themes mutates the <html> class/style on
  // the client before hydration, which is an expected server/client mismatch.
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          nonce={cspNonce}
        >
          <ToastContainer
            autoClose={4000}
            transition={Slide}
            hideProgressBar
            position="bottom-right"
          />

          <Auth0Provider>
            <WithPostHogIdentifier
              disableUserIdentification={disableUserIdentification}
            >
              {/* Skeleton colors live in globals.css (.react-loading-skeleton)
                  so they can follow the theme. */}
              <SkeletonTheme>
                <Provider>
                  <Suspense fallback={null}>
                    <PostHogPageView />
                  </Suspense>
                  {children}
                </Provider>
              </SkeletonTheme>
            </WithPostHogIdentifier>
          </Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  );
};
