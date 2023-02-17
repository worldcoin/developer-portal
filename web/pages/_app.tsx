import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import { useRouter } from "next/router";
import { useValues } from "kea";
import { authLogic } from "logics/authLogic";
import { Fragment } from "react";
import { usePostHog } from "common/hooks/use-posthog";
import Head from "next/head";
import { isSSR } from "common/helpers/is-ssr";

const UNPROTECTED_ROUTES = [
  /^\/login(\?.*)?$/,
  /^\/signup$/,
  /^\/hosted\/.*/,
  /^\/kiosk\/.*/,
];
const ONLY_UNAUTHENTICATED = [/^\/login(\?.*)?$/, /\/signup$/];

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter();
  const { token } = useValues(authLogic);
  usePostHog();

  // ANCHOR: If on the client-side, protect routes appropriately
  if (!isSSR()) {
    if (
      !token &&
      !UNPROTECTED_ROUTES.find((route) => route.test(router.pathname))
    ) {
      const params = new URLSearchParams();
      if (window.location.pathname !== "/logout") {
        params.append(
          "returnTo",
          window.location.href.replace(window.location.origin, "")
        );
      }
      router.push(`/login?${params.toString()}`);
    }
    if (
      token &&
      ONLY_UNAUTHENTICATED.find((route) => route.test(router.pathname))
    ) {
      try {
        const returnTo = router.query.returnTo
          ? encodeURIComponent([router.query.returnTo].flat()[0] || "/")
          : "/";
        router.push(new URL(returnTo, process.env.NEXT_PUBLIC_APP_URL));
      } catch {
        router.push("/");
      }
    }
  }

  const metaImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/meta.png`;
  const metaSiteName = "Worldcoin Developer Portal";

  const metaDescription =
    "Build apps using Worldcoin and World ID, the privacy-preserving proof-of-personhood protocol.";

  return (
    <Fragment>
      <Head>
        {/* ANCHOR favicon */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />

        <link rel="manifest" href="/favicon/site.webmanifest" />

        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#5bbad5"
        />

        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />

        {/* ANCHOR social data */}
        <meta name="description" content={metaDescription} />
        <meta key="og:type" property="og:type" content="website" />

        <meta
          key="og:site_name"
          property="og:site_name"
          content={metaSiteName}
        />

        <meta key="og:image" property="og:image" content={metaImageUrl} />

        <meta
          name="og:description"
          property="og:description"
          content={metaDescription}
        />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content={metaSiteName} />

        <meta
          name="twitter:image"
          property="twitter:image"
          content={metaImageUrl}
        />

        <meta name="twitter:description" content={metaDescription} />
      </Head>
      <div className="bg-warning flex justify-center items-center text-ffffff py-4 text-lg fixed right-0 left-0 z-50 top-0">
        ⚠️ Thanks for using World ID Alpha! This version of the developer portal
        is <b className="pl-1">deprecated</b>. Please contact us on{" "}
        <a
          href="https://discord.gg/worldcoin"
          target="_blank"
          rel="noopener noreferrer"
          className="underline px-1"
        >
          Discord
        </a>
        for details on the new version.
      </div>
      <div className="mb-14"></div>

      <Component {...pageProps} />
    </Fragment>
  );
}

MyApp.getInitialProps = async (params: AppContext) => ({});

export default MyApp;
