import { AnchorHTMLAttributes, Fragment, memo, ReactNode } from "react";
import NextLink, { LinkProps } from "next/link";
import cn from "classnames";

// NOTE Use this component every time you need a link
// if "external" prop passed component will return usual <a> element
// if there is no "external" prop, component returns "next/link" but with div wrapper around children
// this allows you to pass styles with "className" to next/link

export type LinkInterface = {
  children: ReactNode;
  className?: string;
} & (
  | ({
      external?: never | false;
    } & LinkProps)
  | ({ external: true } & AnchorHTMLAttributes<HTMLAnchorElement>)
);

export const Link = memo(function Link(props: LinkInterface) {
  const { external, href, ...restProps } = props;
  let parsedUrl;

  try {
    parsedUrl = props.external ? new URL(props.href as string) : undefined;
  } catch (error) {}

  return (
    <Fragment>
      {external && (
        <a
          {...restProps}
          href={href}
          target={props.target || "_blank"}
          rel={
            props.rel || parsedUrl?.hostname.includes("worldcoin.org")
              ? "noopener" // If the link is in a worldcoin.org domain/subdomain, don't send `noreferrer` to properly track analytics
              : "noopener noreferrer"
          }
        >
          {props.children}
        </a>
      )}

      {!external && (
        <NextLink href={href}>
          <a {...restProps} className={cn(props.className, "cursor-pointer")} />
        </NextLink>
      )}
    </Fragment>
  );
});
