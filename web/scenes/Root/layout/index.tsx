import { ApolloWrapper } from "@/lib/apollo-wrapper";
import PostHogPageView from "@/scenes/Root/providers/PostHogPageView";
import WithPostHogIdentifier from "@/scenes/Root/providers/providers";
import "@/styles/globals.css";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { Provider } from "jotai";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Rubik } from "next/font/google";
import { CSSProperties, Suspense } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Slide, ToastContainer } from "react-toastify";

const rubik = Rubik({ weight: ["400"], subsets: ["latin"] });

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600"],
});

export const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  // Read the per-request CSP nonce set by middleware (`web/middleware.ts`)
  // so client-only providers that inject inline <script> tags during SSR
  // (Apollo's data-transport rehydration script) can attach the nonce and
  // pass our strict script-src.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      style={
        {
          "--font-rubik": rubik.style.fontFamily,
          "--font-mono": ibmPlexMono.style.fontFamily,
        } as CSSProperties
      }
    >
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
