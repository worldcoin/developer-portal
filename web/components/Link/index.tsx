import clsx from "clsx";
import NextLink from "next/link";
import { ComponentProps, PropsWithChildren, memo, useMemo } from "react";

export type CommonLinkProps = PropsWithChildren<
  Omit<ComponentProps<"a">, "ref">
> & {
  prefetch?: boolean;
};

export const Link = memo(function Link(props: CommonLinkProps) {
  const {
    href,
    target,
    children,
    className,
    prefetch = false,
    ...restProps
  } = props;

  const external = useMemo(() => {
    if (!href) {
      return false;
    }

    return href.startsWith("http") || href.startsWith("mailto");
  }, [href]);

  const apiUrl = useMemo(() => {
    if (!href) {
      return false;
    }

    return href.startsWith("/api");
  }, [href]);

  return (
    <>
      {(external || apiUrl) && (
        <a
          target={target ?? apiUrl ? "_self" : "_blank"}
          href={href ?? "!#"}
          className={clsx("leading-none", className)}
          {...restProps}
        >
          {children}
        </a>
      )}

      {!external && !apiUrl && (
        <NextLink
          href={href ?? "!#"}
          prefetch={prefetch}
          className={clsx("leading-none", className)}
          {...restProps}
        >
          {children}
        </NextLink>
      )}
    </>
  );
});
