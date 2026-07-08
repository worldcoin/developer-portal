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
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-8 bg-grey-0 px-3 py-2 text-sm font-medium text-grey-900 opacity-0 shadow-lg outline-none transition-all duration-200 focus:translate-y-0 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none"
      >
        Skip to content
      </a>

      <div
        className={clsx(
          // Common styles
          "min-h-dvh",

          // Desktop styles
          "lg:grid lg:grid-cols-[auto_1fr]",
        )}
      >
        <NavBar />

        <div className="grid grid-rows-auto/1fr">
          <header className="flex items-center justify-between gap-x-4 p-4">
            <BackButton />
            <Search className="flex-1" />
            <ProfileBadge />
          </header>

          <main id="main-content" className="size-full">
            {children}
          </main>
        </div>
      </div>
    </NavProvider>
  );
};
