import useApps from "@/hooks/useApps";
import { useToggle } from "@/hooks/useToggle";
import { urls } from "@/lib/urls";
import { IAppStore, useAppStore } from "@/stores/appStore";
import cn from "classnames";
import { useRouter } from "next/router";
import { Fragment, ReactNode, useEffect, useMemo } from "react";
import { Slide, ToastContainer, toast } from "react-toastify";
import { Icon } from "../Icon";
import { Link } from "../Link";
import { Meta } from "../Meta";
import { AppSelector } from "./AppSelector";
import { LoggedUserDisplay } from "./LoggedUserDisplay";
import { NavItem } from "./NavItem";
import { NavItemGroup } from "./NavItemsGroup";
import { NewAppDialog } from "./NewAppDialog";
import { SystemStatus } from "./SystemStatus";
import { LoginErrorCode } from "@/lib/types";
import { loginErrors } from "@/lib/constants";

const getAppStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
  setCurrentAppById: store.setCurrentAppById,
});

export const Layout = (props: {
  title?: string;
  mainClassName?: string;
  children: ReactNode;
}) => {
  const newAppDialog = useToggle();
  const router = useRouter();
  const { currentApp, setCurrentAppById } = useAppStore(getAppStore);
  const { apps } = useApps();

  useEffect(() => {
    if (!router.query.app_id || !apps) {
      return;
    }

    setCurrentAppById(router.query.app_id as string);
  }, [apps, router.query.app_id, setCurrentAppById]);

  useEffect(() => {
    const loginError = router.query.login_error as LoginErrorCode | undefined;

    if (!loginError) {
      return;
    }

    toast.warn(loginErrors[loginError], {
      autoClose: 10000,
    });
  }, [router.query.login_error]);

  const appId = useMemo(() => {
    if (router.query.app_id) {
      return router.query.app_id as string;
    }
    if (apps?.length) {
      return apps[0].id;
    }
  }, [apps, router.query.app_id]);

  const signInDisabled = useMemo(
    () => currentApp?.engine === "on-chain",
    [currentApp?.engine]
  );

  return (
    <Fragment>
      <ToastContainer autoClose={5000} transition={Slide} />
      <Meta title={props.title} url={router.asPath} />

      <div className="grid h-screen grid-cols-auto/1fr font-rubik bg-gray-50">
        <NewAppDialog
          open={newAppDialog.isOn}
          onClose={newAppDialog.toggleOff}
        />

        <aside className="min-w-[268px] overflow-y-auto p-4 gap-y-4 grid grid-rows-auto/1fr/auto">
          <header className="cursor-pointer">
            <Link href="/">
              <div className="grid justify-start gap-y-0.5">
                <Icon
                  name="logo-dev"
                  className="w-[141px] h-[38px] text-black"
                />
              </div>
            </Link>
          </header>

          <div className="grid gap-y-8 content-start">
            <AppSelector onNewAppClick={newAppDialog.toggleOn} />

            <nav className="min-h-0 overflow-y-auto">
              <NavItemGroup heading="set up">
                <NavItem
                  icon="apps"
                  name="App Profile"
                  href={urls.app(appId)}
                />

                <NavItem
                  icon={
                    signInDisabled
                      ? "world-id-sign-in-disabled"
                      : "world-id-sign-in"
                  }
                  name="Sign In"
                  href={urls.appSignIn(appId)}
                  disabled={signInDisabled}
                  stamp={
                    <span className="text-[10px] leading-none py-0.5 px-1 rounded-[4px] bg-gray-500 text-ffffff">
                      Unavailable for on-chain
                    </span>
                  }
                  stampVisible={signInDisabled}
                />

                <NavItem
                  icon="notepad"
                  name="Anonymous Actions"
                  href={urls.appActions(appId)}
                />
              </NavItemGroup>

              <NavItemGroup heading="build" className="mt-6">
                <NavItem
                  name="Docs"
                  icon="document"
                  href="https://docs.worldcoin.org"
                />
                <NavItem
                  name="Debugger"
                  icon="speed-test"
                  href={urls.debugger(router.query.app_id as string)}
                />

                {/* <NavItem
                  name="Support"
                  icon="help"
                  href="https://worldcoin.org/discord"
                /> */}
              </NavItemGroup>

              <hr className="text-f3f4f5 my-4" />

              <NavItemGroup withoutHeading>
                <NavItem name="My Team" icon="team" href={urls.team()} />
                <NavItem
                  name="Leave Feedback"
                  icon="edit-alt"
                  href="https://toolsforhumanity.typeform.com/SDKFeedback"
                />
                <NavItem
                  name="Log Out"
                  icon="logout"
                  href={urls.logout()}
                  customColor="text-danger"
                />
              </NavItemGroup>
            </nav>
          </div>

          <footer className="grid items-center justify-between gap-y-2">
            <LoggedUserDisplay />

            <div className="flex gap-x-3 items-center">
              <Link
                className="text-11 leading-4 text-neutral-secondary"
                href="https://worldcoin.org/privacy-statement"
                target="_blank"
              >
                Privacy Policy
              </Link>

              <span className="text-neutral-secondary">·</span>

              <Link
                className="text-11 leading-4 text-neutral-secondary"
                href="https://worldcoin.pactsafe.io/rjd5nsvyq.html"
                target="_blank"
              >
                Terms
              </Link>
            </div>

            <SystemStatus />
          </footer>
        </aside>

        <main
          className={cn(
            "max-h-screen p-4 overflow-y-scroll py-8 px-6 bg-white rounded-l-[10px]",
            props.mainClassName
          )}
        >
          {props.children}
        </main>
      </div>
    </Fragment>
  );
};
