import { memo, ReactNode, useMemo } from "react";
import Head from "next/head";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export const Meta = memo(function Meta(props: {
  title?: string;
  url: string;
  children?: ReactNode;
}) {
  const title = useMemo(
    () =>
      props.title
        ? `${props.title} | Worldcoin Dev Portal`
        : "Worldcoin Dev Portal",
    [props.title]
  );

  const url = useMemo(
    () =>
      // Remove all trailing/starting slashes in url parts
      `${publicRuntimeConfig.NEXT_PUBLIC_APP_URL?.replace(
        /\/+$/,
        ""
      )}/${props.url.replace(/^\/+/, "")}`,
    [props.url]
  );

  return (
    <Head>
      <title>
        {props.title ? `${props.title} | Developer Portal` : "Developer Portal"}
      </title>

      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:url" property="og:url" content={url} />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <link rel="icon" href="/favicon.ico" />
      {props.children}
    </Head>
  );
});
