import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import { Fragment, useContext, useEffect } from "react";
import { usePostHog } from "common/hooks/use-posthog";
import Head from "next/head";
import { getCookies } from "cookies-next";
import { AuthProvider } from "contexts/AuthContext";

const App = ({
  Component,
  pageProps,
}: AppProps<{ cookies: { token?: string } }>): JSX.Element => {
  usePostHog();

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

      <AuthProvider token={pageProps.cookies.token}>
        <Component {...pageProps} />
      </AuthProvider>
    </Fragment>
  );
};

App.getInitialProps = async (params: AppContext) => {
  let pageProps = {};

  try {
    pageProps = params.Component.getInitialProps
      ? await params.Component.getInitialProps(params.ctx)
      : {};
  } catch (error) {
    // Is server side

    if (params.ctx.res) {
      params.ctx.res.statusCode = 500;
    }

    pageProps = { error: "Server error", statusCode: 500 };
  }

  return {
    pageProps: {
      ...pageProps,
      cookies: getCookies({ req: params.ctx.req }),
    },
  };
};

export default App;
