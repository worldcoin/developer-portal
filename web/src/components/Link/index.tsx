import cn from "classnames";
import NextLink, { LinkProps } from "next/link";
import {
  AnchorHTMLAttributes,
  forwardRef,
  Fragment,
  memo,
  ReactNode,
} from "react";

// NOTE Use this component every time you need a link
// if "external" prop passed component will return usual <a> element
// if there is no "external" prop, component returns "next/link" but with div wrapper around children
// this allows you to pass styles with "className" to next/link

type RefProp = {
  ref?: React.Ref<HTMLAnchorElement>;
};

export type LinkInterface = {
  children: ReactNode;
  className?: string;
} & (
  | ({
      external?: never | false;
    } & LinkProps &
      RefProp)
  | ({ external: true } & AnchorHTMLAttributes<HTMLAnchorElement> & RefProp)
);

const Link = memo(
  forwardRef<HTMLAnchorElement, LinkInterface>(function Link(props, ref) {
    const { external, href, ...restProps } = props;
    let parsedUrl;

    const className = cn("cursor-pointer text-primary", props.className);

    try {
      parsedUrl = props.external ? new URL(props.href as string) : undefined;
    } catch (error) {}

    return (
      <Fragment>
        {external && (
          <a
            {...restProps}
            href={href}
            className={className}
            target={props.target || "_blank"}
            rel={props.rel || "noopener noreferrer"}
            ref={ref}
          >
            {props.children}
          </a>
        )}

        {!external && <NextLink {...restProps} href={href} passHref />}
      </Fragment>
    );
  })
);

export { Link };
