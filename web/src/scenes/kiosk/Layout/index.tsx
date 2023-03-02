import cn from "classnames";
import { AppLogo } from "src/components/AppLogo";
import { useColorScheme } from "src/hooks/useColorScheme";
import { Icon } from "src/components/Icon";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useCallback, useMemo } from "react";
import { ModelPublicAction } from "src/lib/types";

export const Layout = memo(function Layout(props: {
  actionId?: string;
  app?: ModelPublicAction["app"];
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
  backUrl?: string;
}) {
  const router = useRouter();
  const handleClickBack = useCallback(() => {
    props.backUrl && router.push(props.backUrl);
  }, [props.backUrl, router]);
  const colorScheme = useColorScheme();
  const isDark = useMemo(() => colorScheme === "dark", [colorScheme]);

  return (
    <Fragment>
      <Head>
        <title>World ID Kiosk Verification</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grid grid-rows-[auto_1fr] min-h-screen px-5 dark:bg-000000 dark:text-ffffff">
        <header className="relative grid items-center justify-between grid-flow-col py-5 auto-cols-min">
          {props.backUrl ? (
            <button
              className="transition-opacity text-primary dark:text-ffffff hover:opacity-70"
              onClick={handleClickBack}
            >
              <Icon className="w-6 h-6 rotate-180" name="arrow-right" />
            </button>
          ) : (
            <span />
          )}

          <Icon
            className="absolute h-6 -translate-x-1/2 left-1/2 w-36 dark:text-ffffff"
            name="worldcoin"
          />

          <div
            className={cn(
              "grid items-center grid-flow-col auto-cols-min gap-x-1.5 font-medium text-[14px] leading-[1.2]"
            )}
          >
            <span className="whitespace-nowrap">{props.app?.name}</span>

            {props.app && (
              <AppLogo
                app={props.app}
                className="w-8 h-8"
                textClassName="text-[8px]"
              />
            )}
          </div>
        </header>

        <main
          className={
            "grid grid-rows-[auto_1fr_auto] items-center justify-items-center gap-y-24 lg:gap-y-12 pb-16 lg:pb-8"
          }
        >
          <div className="mt-12 lg:mt-2">
            <h1 className="text-[32px] text-center leading-[38.4px] font-sora tracking-tight font-semibold">
              {props.title}
            </h1>

            {props.description && (
              <span
                className={cn(
                  "mt-12 lg:mt-6 grid p-0.5 rounded-[12px] leading-5 bg-gradient-to-r from-primary to-[#ff5b26]",
                  "shadow-[0_10px_20px_0_rgba(255,104,72,0.2)] dark:shadow-[0_10px_20px_rgba(255,104,72,.05)]"
                )}
              >
                <span
                  className={cn(
                    "p-8 py-5 font-medium leading-[1.25] -tracking-[0.01rem] rounded-[10px]",
                    "bg-ffffff/95 mix-blend-screen dark:bg-[#141113] dark:mix-blend-multiply text-center"
                  )}
                >
                  {props.description}
                </span>
              </span>
            )}
          </div>

          <div>{props.children}</div>

          <div className="grid justify-center text-center gap-y-2">
            <span className="font-medium leading-[1.2]">Action ID</span>

            <span
              className={cn(
                "min-w-[320px] w-min border dark:text-ffffff dark:opacity-50 bg-[#fbfbfb] dark:bg-[#181818]",
                "border-[#dadada] dark:border-[#858494] p-4.5 py-2.5 rounded-xl"
              )}
            >
              {props.actionId}
            </span>
          </div>
        </main>
      </div>
    </Fragment>
  );
});
