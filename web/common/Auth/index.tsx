import { Fragment, memo, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { Meta } from "common/Meta";
import { CookieBanner } from "common/CookieBanner/CookieBanner";

export const Auth = memo(function Auth(props: {
  pageTitle: string;
  pageUrl: string;
  children: ReactNode;
}) {
  return (
    <Fragment>
      {/* FIXME: Unauthenticated routes should use the same layout component so we have a centralized place to set meta tags, scripts, .... */}
      <Meta title={props.pageTitle} url={props.pageUrl} />
      <ToastContainer />
      <CookieBanner />
      <div className="min-h-screen grid items-center justify-center text-neutral-primary">
        {props.children}
      </div>
    </Fragment>
  );
});
