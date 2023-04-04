import "@/globals.css";
import { usePostHog } from "@/hooks/usePostHog";
import { client } from "@/services/apollo";
import { ApolloProvider } from "@apollo/client";
import { IBM_Plex_Mono, Rubik, Sora } from "@next/font/google";
import { NextSeo } from "next-seo";
import type { AppContext, AppProps } from "next/app";
import Head from "next/head";

const sora = Sora({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600", "700"],
});

const rubik = Rubik({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600"],
});

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  usePostHog();
  const metaSiteName = "Worldcoin Developer Portal";

  const metaDescription =
    "Build apps using Worldcoin and World ID, the privacy-preserving global identity protocol.";

  const metaImagesSizes = [
    { width: 109, height: 109 },
    { width: 138, height: 72 },
    { width: 180, height: 94 },
    { width: 180, height: 110 },
    { width: 250, height: 250 },
    { width: 355, height: 225 },
    { width: 360, height: 123 },
    { width: 407, height: 213 },
    { width: 502, height: 264 },
    { width: 896, height: 512 },
    { width: 1024, height: 512 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 },
  ];

  const metaImages = metaImagesSizes.map(({ width, height }, index) => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/images/meta/${width}x${height}.png`,
    width,
    height,
    alt: `Worldcoin Developer Portal`,
  }));

  return (
    <ApolloProvider client={client}>
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
      </Head>

      <NextSeo
        description={metaDescription}
        openGraph={{
          title: metaSiteName,
          type: "website",
          site_name: metaSiteName,
          description: metaDescription,
          images: metaImages,
        }}
        twitter={{
          site: metaSiteName,
          cardType: "summary",
        }}
      />

      <Component {...pageProps} />

      <style jsx global>{`
        :root {
          --font-sora: ${sora.style.fontFamily};
          --font-rubik: ${rubik.style.fontFamily};
          --font-mono: ${ibmPlexMono.style.fontFamily};
        }
      `}</style>
    </ApolloProvider>
  );
};

App.getInitialProps = async (params: AppContext) => ({});

export default App;
