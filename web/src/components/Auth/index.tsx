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
      <div className="absolute left-6 top-8 hidden md:inline">
        <Link href="/">
          <div className="grid justify-start gap-y-0.5">
            <Icon
              name="logo-dev"
              className="w-40 h-12 text-neutral-dark ml-4.5"
            />
          </div>
        </Link>
      </div>
      <div
        className={cn(
          "grid justify-center justify-items-center content-center min-h-screen text-neutral-primary",
          props.className
        )}
      >
        {props.children}
      </div>
    </Fragment>
  );
});
