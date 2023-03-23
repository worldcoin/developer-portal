import cn from "classnames";
import Link from "next/link";
import { Fragment, memo, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { CookieBanner } from "src/components/CookieBanner/CookieBanner";
import { Meta } from "src/components/Meta";
import { Icon } from "../Icon";

export const Auth = memo(function Auth(props: {
  pageTitle: string;
  pageUrl: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Fragment>
      {/* FIXME: Unauthenticated routes should use the same layout component so we have a centralized place to set meta tags, scripts, .... */}
      <Meta title={props.pageTitle} url={props.pageUrl} />
      <ToastContainer />
      <CookieBanner />
      <div
        className={cn(
          "grid justify-items-center content-center min-h-screen text-neutral-primary",
          props.className
        )}
      >
        {props.children}
      </div>
    </Fragment>
  );
});
