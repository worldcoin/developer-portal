import { memo } from "react";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { IAppStore, useAppStore } from "src/stores/appStore";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const Header = memo(function Header() {
  return (
    <section className="grid grid-flow-col justify-between">
      <div className="grid gap-y-3">
        <h1 className="font-sora text-24 font-semibold leading-tight">
          Sign In
        </h1>
        <p className="text-18 text-neutral-secondary leading-none">
          Add Sign in with Worldcoin to your website or app.
        </p>
      </div>

      <Link
        href="https://docs.worldcoin.org/id/sign-in"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="grid gap-x-2 grid-cols-1fr/auto items-start mt-2">
          <p className="text-14 font-medium text-neutral-primary">Learn more</p>

          <div className="p-1 rounded-full text-0 bg-neutral-dark/10 hover:bg-neutral-dark/20 transition-colors">
            <Icon name="angle-down" className="-rotate-90 w-4 h-4" />
          </div>
        </div>
      </Link>
    </section>
  );
});
