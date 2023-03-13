import "@/globals.css";
import type { AppContext, AppProps } from "next/app";
import { Fragment } from "react";
import { usePostHog } from "@/hooks/usePostHog";
import Head from "next/head";
import { Sora, Rubik, IBM_Plex_Mono } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
});

const rubik = Rubik({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-rubik",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  usePostHog();

  const metaImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/meta.png`;
  const metaSiteName = "Worldcoin Developer Portal";

  const metaDescription =
    "Build apps using Worldcoin and World ID, the privacy-preserving global identity protocol.";

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

      <div
        className={`${sora.variable} ${rubik.variable} ${ibmPlexMono.variable} contents`}
      >
        <Component {...pageProps} />
      </div>
    </Fragment>
  );
};

App.getInitialProps = async (params: AppContext) => ({});

export default App;
