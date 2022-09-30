import { Fragment, memo, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { text } from "common/styles";
import cn from "classnames";
import { Meta } from "common/Meta";
import { CookieBanner } from "common/CookieBanner/CookieBanner";

export const Auth = memo(function Auth(props: {
  pageTitle: string;
  pageUrl: string;
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <Fragment>
      {/* FIXME: Unauthenticated routes should use the same layout component so we have a centralized place to set meta tags, scripts, .... */}
      <Meta title={props.pageTitle} url={props.pageUrl} />
      <ToastContainer />
      <CookieBanner />

      <div className="min-h-screen grid items-center justify-center bg-gradient-to-r from-fff0ed to-edecfc">
        <main className="w-[544px] px-12 py-16 grid bg-ffffff shadow-box rounded-xl">
          <h1 className="mb-1 font-sora text-30 text-neutral-dark text-center leading-9">
            {props.title}
          </h1>
          <p className={cn(text.caption, "text-center leading-5")}>
            {props.caption}
          </p>
          {props.children}
        </main>
      </div>
    </Fragment>
  );
});
