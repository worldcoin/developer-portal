import { Icon } from "common/Icon";
import { LoggedUserDisplay } from "common/LoggedUserDisplay";
import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { NavItem } from "./NavItem";
import { ToastContainer } from "react-toastify";
import { Slide } from "react-toastify";
import { urls } from "urls";
import { useRouter } from "next/router";
import { Meta } from "common/Meta";
import cn from "classnames";
import { CookieBanner } from "common/CookieBanner/CookieBanner";

export const Layout = (props: {
  title?: string;
  mainClassName?: string;
  children: ReactNode;
}) => {
  const router = useRouter();

  return (
    <Fragment>
      <ToastContainer autoClose={5000} transition={Slide} />
      <CookieBanner />
      <Meta title={props.title} url={router.asPath} />

      <div className="grid h-screen grid-cols-auto/1fr font-rubik">
        <aside className="min-w-[304px] overflow-y-auto px-3.5 gap-y-4 pt-8 pb-6 grid grid-rows-auto/1fr/auto border-r border-neutral/30">
          <header className="cursor-pointer">
            <Link href="/">
              <div className="grid justify-start gap-y-0.5">
                <Icon
                  name="logo"
                  className="w-32 h-6 text-neutral-dark ml-4.5"
                />
                <div className="px-1 rounded-md bg-primary/20 justify-self-end">
                  <p className="font-sora text-[12px] text-primary">
                    {"<"}
                    <span className="font-bold">Dev</span>
                    {"/Portal>"}
                  </p>
                </div>
              </div>
            </Link>
          </header>

          <nav className="min-h-0 overflow-y-auto self-center">
            <NavItem name="Apps" icon="apps" href={urls.apps()} />

            <NavItem
              name="Proof Debugger"
              icon="speed-test"
              href={urls.debugger()}
            />

            <NavItem name="My Team" icon="team" href={urls.team()} />

            <NavItem
              name="Simulator"
              icon="meter"
              href="https://simulator.worldcoin.org"
            />

            <NavItem
              name="Docs"
              icon="document"
              href="https://id.worldcoin.org/docs"
            />

            <NavItem
              name="Support (Discord)"
              icon="help"
              href="https://discord.gg/worldcoin"
            />

            <NavItem
              name="Log Out"
              icon="logout"
              href="/logout"
              customColor="text-warning"
            />
          </nav>

          <footer className="grid items-center justify-between grid-flow-col">
            <LoggedUserDisplay />
          </footer>
        </aside>

        <main
          className={cn(
            "max-h-screen p-4 overflow-y-scroll lg:p-8 xl:p-16 bg-f9f9f9/60",
            props.mainClassName
          )}
        >
          {props.children}
        </main>
      </div>
    </Fragment>
  );
};
