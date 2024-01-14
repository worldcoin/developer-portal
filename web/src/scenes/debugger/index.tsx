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

enum DebuggerMode {
  SignIn = "Sign in with World ID",
  Actions = "Actions",
}

const envs = [
  { name: "Production", icon: "rocket" },
  { name: "Staging", icon: "cloud" },
] as Array<{ name: string; icon: IconType }>;

const exampleVR = `{
  "nullifier_hash": "0x26a12376e45f7b93fba3d5ddd7f1092eb...",
  "proof": "0x0751916cb52efab89f7045f5174638d072ea60d9e9...",
  "merkle_root": "0x0f6ee51b93a1261af6c4302c30afbbdf8af5...",
  "verification_level": "orb"
}`;

export function Debugger(): JSX.Element {
  const [action, setAction] = useState("");
  const [signal, setSignal] = useState("");
  const [response, setResponse] = useState("");
  const [mode, setMode] = useState(DebuggerMode.SignIn);
  const [env, setEnv] = useState<(typeof envs)[0]>(envs[0]);
  const [hasTried, setHasTried] = useState(false);
  const currentApp = useAppStore((state) => state.currentApp);

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasTried(true);
    setResponse(e.target.value);
  };

  return (
    <Layout
      title="Debugger"
      mainClassName={cn(
        "grid gap-16",
        // NOTE: container - card - gap
        "grid-cols-[calc(100%-380px-64px)_380px]"
      )}
    >
      <div className="space-y-12">
        <div className="grid grid-flow-col auto-cols-max gap-6 items-center">
          <Illustration icon="speed-test" className="w-16 h-16" />

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
            <FieldInput
              value={currentApp?.app_metadata?.name ?? "Loading..."}
              disabled
            />
          </FieldGroup>

          <FieldGroup label="Mode" className="!text-14">
            <Toggler
              values={Object.values(DebuggerMode)}
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

          {mode === DebuggerMode.Actions && (
            <div className="flex w-full justify-between space-x-10">
              <div className="grow">
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
              <div className="grow">
                <FieldGroup
                  className="group"
                  label={<FieldLabel className="!text-14">Signal</FieldLabel>}
                >
                  <FieldInput
                    placeholder="my_signal"
                    className="w-full"
                    value={signal}
                    onChange={(e) => setSignal(e.target.value)}
                  />
                  <span className="text-12 text-neutral-secondary">
                    Enter the signal as passed to IDKit
                  </span>
                </FieldGroup>
              </div>
            </div>
          )}
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
              placeholder={exampleVR}
              className="w-full min-h-[340px] p-6"
              onChange={handleResponseChange}
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
          action={mode === DebuggerMode.Actions ? action : ""}
          signal={mode === DebuggerMode.Actions ? signal : ""}
          response={response}
          hasTried={hasTried}
        />
      )}
    </Layout>
  );
}
