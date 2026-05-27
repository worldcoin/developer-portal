import { ApolloWrapper } from "@/lib/apollo-wrapper";
import PostHogPageView from "@/scenes/Root/providers/PostHogPageView";
import WithPostHogIdentifier from "@/scenes/Root/providers/providers";
import "@/styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Provider } from "jotai";
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

export const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
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

        <UserProvider>
          <WithPostHogIdentifier>
            <ApolloWrapper>
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
        </UserProvider>
      </body>
    </html>
  );
};
