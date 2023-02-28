import classNames from "classnames";
import { Illustration } from "common/Auth/Illustration";
import { Button } from "common/Button";
import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldLabel } from "common/FieldLabel";
import { Icon, IconType } from "common/Icon";
import { Layout } from "common/Layout";
import { App } from "common/Layout/temp-data";
import { Selector } from "common/Selector";
import { useCallback, useState } from "react";
import { useAppsStore } from "stores/app-store";
import { Toggler } from "./Toggler";

// FIXME: mocked

const code = `{
  “proof”: “0x123”,
  “merkle_root”: “0x123”,
  “nullifier_hash”: “0x123”
}

@Override

public void onCreate() {

// Create a PostHog client with the given context, API key and host.

PostHog posthog = new PostHog
  .Builder(this, POSTHOG_API_KEY, POSTHOG_HOST)
  .captureApplicationLifecycleEvents() // Record certain application events autom
  .recordScreenViews() // Record screen views automatically!
  .recordScreenViews() // Record screen views automatically!
});`;

const modes = ["Sign in with World ID", "Actions"];
const envs = [
  { name: "Production", icon: "rocket" },
  { name: "Staging", icon: "cloud" },
] as Array<{ name: string; icon: IconType }>;

// end mocked

export function Debugger(): JSX.Element {
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [currentEnv, setCurrentEnv] = useState<(typeof envs)[0]>(envs[0]);
  const [currentMode, setCurrentMode] = useState(modes[0]);

  const handleFirstLoad = useCallback(
    (state: { apps: Array<App> }) => {
      if (!currentApp) {
        setCurrentApp(state.apps[0]);
      }
      return state;
    },
    [currentApp]
  );

  const { apps } = useAppsStore(handleFirstLoad);

  return (
    <Layout
      title="Debugger"
      mainClassName={classNames(
        "grid gap-16",
        // NOTE: container - card - gap
        "grid-cols-[calc(100%-380px-64px)_380px]"
      )}
    >
      <div className="space-y-12">
        <div className="grid grid-flow-col auto-cols-max gap-6 items-center">
          <Illustration icon="speed-test" />

          <div className="flex flex-col gap-1">
            <h1 className="font-sora text-20 font-semibold">Proof debugger</h1>

            <span className="text-14 text-neutral-secondary">
              This will check all your parameters and validate a World ID ZKP
              with the official smart contract.
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="font-semibold font-sora">Input parameters</h2>

          <span className="text-14 text-neutral-secondary">
            Parameters you send to the JS widget to get a World ID proof.
          </span>
        </div>

        <div className="space-y-8">
          <FieldGroup label="App" className="!text-14">
            <Selector
              values={apps}
              value={currentApp}
              setValue={setCurrentApp}
              render={(item) => <>{item ? item.name : "Loading"}</>}
            />
          </FieldGroup>

          <FieldGroup label="Mode" className="!text-14">
            <Toggler
              values={modes}
              value={currentMode}
              setValue={setCurrentMode}
              render={(item) => <>{item}</>}
            />
          </FieldGroup>

          <FieldGroup label="Environment" className="!text-14">
            <Selector
              values={envs}
              value={currentEnv}
              setValue={setCurrentEnv}
              render={(item) => (
                <span className="flex items-center gap-2.5 text-14">
                  <Icon className="w-4.5 h-4.5" name={item.icon} />
                  {item.name}
                </span>
              )}
            />
            <span className="text-12 text-neutral-secondary">
              We’ll verify the proof in the right network and make sure you have
              a valid identity too.
            </span>
          </FieldGroup>

          <FieldGroup
            label={<FieldLabel className="!text-14">Action</FieldLabel>}
          >
            <FieldInput placeholder="0x...." />
          </FieldGroup>
        </div>

        <div>
          <div className="flex flex-col gap-1">
            <h2 className="font-sora font-semibold">Output parameters</h2>

            <span className="text-14 text-neutral-secondary">
              These are the parameters you get from the JS widget. Just paste
              the object directly below.
            </span>
          </div>

          <div className="rounded-xl border border-ebecef overflow-clip font-mono">
            <h3 className="p-4 px-6 text-14 bg-fbfbfc border-b border-[inherit]">
              Verification Response
            </h3>

            <pre className="p-4 px-6 overflow-x-auto max-w-[120ch]">{code}</pre>
          </div>
        </div>
      </div>

      <div className="pr-10 self-center">
        <div className="rounded-xl p-6 border border-f0edf9 space-y-6">
          <div className="space-y-4">
            <h4 className="font-sora font-semibold">Debugging results</h4>

            <div className="bg-fff9e5 grid grid-flow-col gap-4 p-6">
              <Icon name="warning-triangle" className="w-4.5 h-4.5" noMask />

              <div className="space-y-1.5">
                <p className="text-ffb11b text-14 font-bold font-sora">
                  Warning
                </p>

                <p className="text-12 leading-4.5 text-657080 font-mono">
                  Your proof is almost valid. Looks like you are using custom
                  advanced encoding but the action_id is not properly encoded.
                  Check this guide on how to encode it or remove the advanced
                  option.
                </p>
              </div>
            </div>
          </div>

          <Button className="w-full p-4">Validate Proof</Button>
        </div>
      </div>
    </Layout>
  );
}
