import { memo, ReactNode } from "react";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { Layout } from "src/components/Layout";
import { NewAppDialog } from "src/components/Layout/NewAppDialog";
import { useToggle } from "src/hooks/useToggle";
import { LinkCard } from "./LinkCard";
import { PageInfo } from "@/components/PageInfo";

export const NoApps = memo(function NoApps(props: { pageInfo: ReactNode }) {
  const newAppDialog = useToggle();

  return (
    <Layout
      title="Apps"
      mainClassName="grid grid-rows-auto/1fr/auto px-12 py-8 gap-y-12"
    >
      <NewAppDialog open={newAppDialog.isOn} onClose={newAppDialog.toggleOff} />

      {props.pageInfo}

      <div className="grid gap-y-8 justify-center justify-items-center content-center">
        <div className="bg-blue-secondary rounded-full p-5 row-span-2 self-center flex">
          <Icon name="apps" className="h-6 w-6 text-blue-primary" />
        </div>

        <div className="grid gap-y-3 text-gray-900 max-w-[378px]">
          <h2 className="text-20 font-sora font-semibold text-center">
            Time to create your first app!
          </h2>

          <p className="text-14 text-gray-500 text-center">
            Each app supports Sign in with Worldcoin as well as Anonymous
            Actions for the ultimate privacy.
          </p>
        </div>

        <Button onClick={newAppDialog.toggleOn} className="px-8 py-3">
          Create New App
        </Button>
      </div>

      <div className="grid gap-y-2">
        <h3 className="uppercase text-12 font-medium text-gray-500">
          Learn how to use the Developer Portal
        </h3>

        <div className="grid grid-cols-3 gap-x-2">
          <LinkCard
            href="https://docs.worldcoin.org/"
            external
            heading="Read the docs"
            description="Explore guides, API & library reference, as well as details on the protocol."
          />

          <LinkCard
            href="https://discord.gg/worldcoin"
            external
            heading="Join our Discord community"
            description="Jam on ideas, see what others are building, ask questions. Look for the #developers channel."
          />

          <LinkCard
            href="https://github.com/worldcoin/developer-portal"
            external
            heading="Contribute to the Worldcoin ecosystem"
            description="World ID is open source and always looking for contributions."
          />
        </div>
      </div>
    </Layout>
  );
});
