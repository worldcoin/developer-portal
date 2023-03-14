import cn from "classnames";
import { Illustration } from "src/components/Auth/Illustration";
import { FieldGroup } from "src/components/FieldGroup";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { Icon, IconType } from "src/components/Icon";
import { Layout } from "src/components/Layout";
import { Selector } from "src/components/Selector";
import { useState } from "react";
import { useAppStore } from "src/stores/appStore";
import { Toggler } from "../../components/Toggler";
import { Result } from "./Result";

// FIXME: mocked

const modes = ["Sign in with World ID", "Actions"];
const envs = [
  { name: "Production", icon: "rocket" },
  { name: "Staging", icon: "cloud" },
] as Array<{ name: string; icon: IconType }>;

// end mocked

const vr = `{
  "merkle_root": "0x26903683ef08333efbba303542be4b173605dd8d63ce1621ceb12628a1e30497",
  "nullifier_hash": "0x13d7d863751d30b5daea3153cbde87850de30c6f75185a3fe1b46b1329f364c7",
  "proof": "0x0a4f805cd24a1a14fad5c8afb93c5c8a0439a6b422e292788bb89daebc8da6631adf579a79633d114d5cd80f410198d25e46d5455ce5feaddaa0cb127d0589422f0485a773e4e4682c7e623ae6855eb8f5e949a375567cbb1000b3372fa3f46c12b09a645e216f8addb8af7e24ebfa04b18aa421ba064d10bbfa9042df4065181dc7ecfb2f9787ef6cdf841536662d2a1cf3353da6f21acea3fa6e8e1552882d2f6087bc5e260459cbf28df03154935a12ebaf8d6b85db7e22aa8b7e7f46ae2310a706b5d00f725a4cbcc4c6f7d06d7eac4364f6fc058eab0d86872957f229772189d5c27b30edd1150bdb6eda7212e0c1951f310be56d1500e10e2c9226da63",
  "credential_type": "phone"
}`;

export function Debugger(props: { user_id?: string }): JSX.Element {
  const [action, setAction] = useState("my_action");
  const [response, setResponse] = useState(vr);
  const [env, setEnv] = useState<(typeof envs)[0]>(envs[0]);
  const [mode, setMode] = useState(modes[0]);
  const currentApp = useAppStore((state) => state.currentApp);

  return (
    <Layout
      userId={props.user_id}
      title="Debugger"
      mainClassName={cn(
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
            <FieldInput value={currentApp?.name ?? "Loading..."} disabled />
          </FieldGroup>

          <FieldGroup label="Mode" className="!text-14">
            <Toggler
              values={modes}
              value={mode}
              setValue={setMode}
              render={(item) => <>{item}</>}
            />
          </FieldGroup>

          <FieldGroup label="Environment" className="!text-14">
            <Selector
              values={envs}
              value={env}
              setValue={setEnv}
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
            className="group"
            label={<FieldLabel className="!text-14">Action</FieldLabel>}
          >
            <FieldInput
              placeholder="my_action"
              className="w-full"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
            <span className="text-12 text-neutral-secondary">
              Enter your action as passed to IDKit
            </span>
          </FieldGroup>
        </div>

        <div className="space-y-4">
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

            <textarea
              className="w-full min-h-[340px] p-6"
              onChange={(e) => setResponse(e.target.value)}
            >
              {response}
            </textarea>
          </div>
        </div>
      </div>

      {currentApp && (
        <Result
          classNames="self-center"
          appId={currentApp.id}
          isStaging={env === envs[1]}
          action={action}
          response={response}
        />
      )}
    </Layout>
  );
}
