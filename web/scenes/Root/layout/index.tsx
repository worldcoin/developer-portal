import { ApolloWrapper } from "@/lib/apollo-wrapper";
import PostHogPageView from "@/scenes/Root/providers/PostHogPageView";
import WithPostHogIdentifier from "@/scenes/Root/providers/providers";
import "@/styles/globals.css";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { Provider } from "jotai";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Rubik } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Slide, ToastContainer } from "react-toastify";

const rubik = Rubik({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["400"],
});

const ibmPlexMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  style: ["normal"],
  variable: "--font-mono",
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
  variable: "--font-gta",
});

const twkLausanne = localFont({
  display: "swap",
  src: "../../../app/fonts/TWKLausanne-550.woff2",
  variable: "--font-twk",
  weight: "500",
});

// WorldProMVP.ttf is a variable font whose real wght axis is 300–800 (default
// 300). Declaring "100 900" advertised a range the file doesn't have, so weight
// requests outside 300–800 clamped and the mapping didn't match Figma. Declare
// the true axis so `font-[325]`, medium, semibold, etc. all resolve correctly.
const worldPro = localFont({
  display: "swap",
  src: "../../../app/fonts/WorldProMVP.ttf",
  variable: "--font-world",
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
  // Read the per-request CSP nonce set by the proxy (`web/proxy.ts`)
  // so client-only providers that inject inline <script> tags during SSR
  // (Apollo's data-transport rehydration script) can attach the nonce and
  // pass our strict script-src.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <ToastContainer
          autoClose={4000}
          transition={Slide}
          hideProgressBar
          position="bottom-right"
        />

        <Auth0Provider>
          <WithPostHogIdentifier>
            <ApolloWrapper nonce={nonce}>
              <SkeletonTheme baseColor="#F3F4F5" highlightColor="#EBECEF">
                <Provider>
                  <Suspense fallback={null}>
                    <PostHogPageView />
                  </Suspense>
                  {children}
                </Provider>
              </SkeletonTheme>
            </ApolloWrapper>
          </WithPostHogIdentifier>
        </Auth0Provider>
      </body>
    </html>
  );
};
