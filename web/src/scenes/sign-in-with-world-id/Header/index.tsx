import { memo } from "react";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { getAppStore, useAppStore } from "stores/appStore";

export const Header = memo(function Header() {
  const { currentApp } = useAppStore(getAppStore);

  return (
    <section className="grid grid-flow-col justify-between">
      <div className="grid gap-y-3">
        <h1 className="font-sora text-24 font-semibold leading-tight">
          Sign In
        </h1>
        <p className="text-18 text-neutral-secondary leading-none">
          {currentApp?.description_internal}
        </p>
      </div>

      <div className="grid gap-x-2 grid-cols-1fr/auto items-start mt-2">
        <p className="text-14 font-medium">Learn more about what’s sign-in</p>

        {/* FIXME: Update href */}
        <Link
          href="#"
          className="p-1 rounded-full text-0 bg-neutral-dark/10 hover:bg-neutral-dark/20 transition-colors"
        >
          <Icon name="angle-down" className="-rotate-90 w-4 h-4" />
        </Link>
      </div>
    </section>
  );
});
