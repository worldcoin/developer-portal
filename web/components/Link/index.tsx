import clsx from "clsx";
import NextLink from "next/link";
import { ComponentProps, PropsWithChildren, memo, useMemo } from "react";

export type CommonLinkProps = PropsWithChildren<
  Omit<ComponentProps<"a">, "ref">
>;

export const Link = memo(function Link(props: CommonLinkProps) {
  const { href, target, children, className, ...restProps } = props;

  const external = useMemo(() => {
    if (!href) {
      return false;
    }

    return href.startsWith("http") || href.startsWith("mailto");
  }, [href]);

  return (
    <>
      {external && (
        <a
          target={target ?? "_blank"}
          href={href ?? "!#"}
          className={clsx("leading-none", className)}
          {...restProps}
        >
          {children}
        </a>
      )}

      {!external && (
        <NextLink
          href={href ?? "!#"}
          prefetch={false}
          className={clsx("leading-none", className)}
          {...restProps}
        >
          {children}
        </NextLink>
      )}
    </>
  );
});
