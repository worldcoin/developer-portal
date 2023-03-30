import { memo } from "react";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { Layout } from "src/components/Layout";
import { NewAppDialog } from "src/components/Layout/NewAppDialog";
import { useToggle } from "src/hooks/useToggle";
import { LinkCard } from "./LinkCard";

export const NoApps = memo(function NoApps() {
  const newAppDialog = useToggle();

  return (
    <Layout
      title="Apps"
      mainClassName="grid grid-rows-auto/1fr/auto px-12 py-8"
    >
      <NewAppDialog open={newAppDialog.isOn} onClose={newAppDialog.toggleOff} />

      <div className="grid grid-rows-2 grid-cols-auto/1fr bg-gray-50 border border-gray-200 rounded-xl p-8 gap-x-8 gap-y-1">
        <div className="bg-white rounded-full p-5 row-span-2 self-center flex">
          <Icon name="apps" className="h-6 w-6" />
        </div>

        <h1 className="font-sora font-semibold self-end text-gray-900">
          Home for your app overview
        </h1>

        <p className="text-gray-500 text-14 self-start">
          Everything related to your specific app will be here once you create
          your first app.
        </p>
      </div>

      <div className="grid gap-y-8 justify-center justify-items-center content-center">
        <div className="bg-blue-secondary rounded-full p-5 row-span-2 self-center flex">
          <Icon name="apps" className="h-6 w-6 text-blue-primary" />
        </div>

        <div className="grid gap-y-3 text-gray-900 max-w-[378px]">
          <h2 className="text-20 font-sora font-semibold text-center">
            Time to create your first app!
          </h2>

          <p className="text-14 text-gray-500 text-center">
            If you&apos;re looking for something and can&apos;t find it, feel
            free to contact us and we will help you out.
          </p>
        </div>

        <Button onClick={newAppDialog.toggleOn} className="px-8 py-3">
          Create New App
        </Button>
      </div>

      <div className="grid gap-y-2">
        <h3 className="uppercase text-12 font-medium text-gray-500">
          learn how to use developers portal
        </h3>

        <div className="grid grid-cols-3 gap-x-2">
          <LinkCard
            href="https://docs.worldcoin.org/"
            external
            heading="Read the documentation"
            description="Explore our guides, API reference, app examples and all that’s in our documentation."
          />

          <LinkCard
            href="#" // FIXME: add link
            external
            heading="Get a live demo appointment"
            description="Reach out to our team and talk about all the possibilities with Worldcoin developers portal."
          />

          <LinkCard
            href="#" // FIXME: add link
            external
            heading="Watch a guide video"
            description="Reach out to our team and talk about all the possibilities with Worldcoin developers portal."
          />
        </div>
      </div>
    </Layout>
  );
});
