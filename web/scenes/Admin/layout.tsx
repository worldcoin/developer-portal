import { BackButton } from "@/components/AdminDashboard/BackButton";
import { NavBar } from "@/components/AdminDashboard/NavBar";
import { NavProvider } from "@/components/AdminDashboard/NavProvider";
import { ProfileBadge } from "@/components/AdminDashboard/ProfileBadge";
import { Search } from "@/components/AdminDashboard/Search";
import clsx from "clsx";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavProvider>
      {/* NOTE: accessibility skip link, hidden until focused via keyboard */}
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 -translate-y-20 rounded-8 bg-grey-0 px-3 py-2 text-sm font-medium text-grey-900 opacity-0 shadow-lg outline-hidden transition-all duration-200 focus:translate-y-0 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none"
      >
        Skip to content
      </a>

      <div
        className={clsx(
          // Common styles
          "relative grid min-h-dvh overflow-x-clip bg-grey-50 p-4",

          // Desktop styles
          "lg:grid lg:h-dvh lg:grid-cols-[auto_1fr] lg:gap-x-4 lg:overflow-hidden",
          "3xl:p-5",
          "4xl:p-7",
        )}
      >
        <div className="grid min-w-0 grid-rows-auto/1fr gap-y-4 pb-4 lg:min-h-0 lg:pb-0">
          <header className={clsx("flex items-center", "3xl:p-5", "4xl:p-7")}>
            <div
              className={clsx(
                "mx-auto flex w-full max-w-7xl items-center gap-x-4",
                "3xl:max-w-[1600px] 3xl:gap-x-5",
                "4xl:max-w-[2240px] 4xl:gap-x-7",
              )}
            >
              <BackButton />
              <Search className="flex-1" />
              <ProfileBadge />
            </div>
          </header>

          <main
            id="main-content"
            className="size-full min-h-0 min-w-0 overflow-x-clip"
          >
            <div
              className={clsx(
                "mx-auto size-full max-w-7xl",
                "3xl:max-w-[1600px]",
                "4xl:max-w-[2240px]",
              )}
            >
              {children}
            </div>
          </main>
        </div>

        <NavBar />
      </div>
    </NavProvider>
  );
};
