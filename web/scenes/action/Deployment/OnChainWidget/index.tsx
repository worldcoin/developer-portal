import { Icon } from "common/Icon";
import { Link } from "common/components/Link";
import { Button } from "common/Button";
import { Widget } from "common/Widget";
import { useCallback, useState } from "react";
import { Progress } from "scenes/action/common/Progress";
import { ProgressStep } from "scenes/action/types/progress-step";
import { Select } from "common/Select";
import { SelectItem } from "common/types/select-item";
import { Overview } from "scenes/action/common/Overview";
import { CodeBlock } from "common/CodeBlock";
import { Contracts } from "./Contracts";
import { JSWidgetInstructions } from "scenes/action/common/JSWidgetInstructions";
import { useActions, useValues } from "kea";
import { text } from "common/styles";
import { actionLogic } from "logics/actionLogic";

// FIXME remove when real data will be live
const steps: Array<ProgressStep> = [
  {
    name: "Select your chain",
    value: "select",
    finished: true,
  },
  {
    name: "Build your smart contract",
    value: "build",
    finished: false,
  },
  { name: "Deploy your smart contract", value: "deploy", finished: false },
  { name: "Integration is live!", value: "live", finished: false },
];

export function OnChainWidget(): JSX.Element | null {
  const { currentAction } = useValues(actionLogic);
  const { enableUserInterface, updateAction } = useActions(actionLogic);
  const [step, _setStep] = useState<ProgressStep>(steps[0]);

  const [chainList, setChainList] = useState<Array<SelectItem>>([
    {
      name: "Polygon",
      value: "polygon",
      icon: { name: "polygon", noMask: true },
      disabled: false,
    },
    {
      name: "Mainnet",
      value: "eth",
      icon: { name: "eth", noMask: true },
      disabled: true,
    },
    {
      name: "Arbitrum",
      value: "arbitrum",
      icon: { name: "arbitrum", noMask: true },
      disabled: true,
    },
    {
      name: "Optimism",
      value: "optimism",
      icon: { name: "optimism", noMask: true },
      disabled: true,
    },
  ]);

  const changeValue = useCallback(
    (value: string) => {
      if (value !== currentAction?.crypto_chain) {
        updateAction({ attr: "crypto_chain", value });
      }

      const selected = chainList.find(
        (chain) => chain.value === value
      ) as SelectItem;

      setChainList([
        selected,
        ...(chainList.filter((chain) => chain.value !== value) || []),
      ]);
    },
    [chainList, currentAction?.crypto_chain, updateAction]
  );

  const widgetEnabled =
    currentAction?.user_interfaces.enabled_interfaces?.includes("widget");

  if (!currentAction) {
    return null;
  }

  return (
    <div className="grid gap-y-6">
      {!widgetEnabled && (
        <>
          <Widget title="Deployment progress">
            <Progress currentStep={step} steps={steps} />
          </Widget>

          <button
            className="text-primary grid grid-flow-col justify-center"
            onClick={() => enableUserInterface("widget")}
          >
            <span className="font-medium">
              Skip integration instructions. Go Live!
            </span>
            <Icon name="angle-down" className="w-6 h-6 -rotate-90" />
          </button>
        </>
      )}

      <Widget title="Contracts" opened expandable>
        <Contracts />
      </Widget>

      <Widget
        expandable
        opened
        title="Overview"
        description="On-chain deployment"
      >
        <Overview
          items={[
            { icon: "overview-js", text: "Your dapp shows the JS widget" },

            {
              icon: "overview-qr",
              text: (
                <span>
                  User verifies with World ID on{" "}
                  <span className="font-semibold">your</span> site
                </span>
              ),
            },

            {
              icon: "overview-proof",
              text: "Your dapp sends the proof to your smart contract",
            },

            {
              icon: "overview-contract",
              text: "Your smart contract calls our contract to verify the proof and executes",
            },
          ]}
        />
      </Widget>

      <Widget
        title="Chain"
        className="!overflow-visible"
        childrenClassName="!p-0"
      >
        <div className="relative h-16 z-10">
          <Select
            className="bg-ffffff rounded-b-xl [box-shadow:_0_4px_10px_rgba(0,0,0,0.10)]"
            changeValue={changeValue}
            items={chainList}
            value={currentAction.crypto_chain}
            notSelectedText="Please select a chain..."
            notAvailableStamp="Coming soon"
          />
        </div>
      </Widget>

      <Widget
        expandable
        opened={!widgetEnabled}
        title="Deployment instructions"
      >
        <div className="grid gap-y-6">
          <div className="grid grid-cols-auto/1fr items-center gap-x-5">
            <Icon name="checkmark-selected" className="w-6 h-6 text-primary" />
            <span className="font-semibold">
              Fork our starter kit to create your smart contract
            </span>
          </div>

          <div className="flex">
            <div className="flex-1">
              <div className="font-semibold">Hardhat starter kit</div>
              <div className={text.caption}>
                Deploy your smart contract using the Hardhat toolkit
              </div>
              <Button
                className="mt-4"
                variant="contained"
                color="primary"
                fullWidth
                maxWidth="xs"
                component={Link}
                external
                href="https://github.com/worldcoin/world-id-starter-hardhat"
              >
                Go to Hardhat starter kit
              </Button>
            </div>
            <div className="flex-1">
              <div className="font-semibold">Foundry starter kit</div>
              <div className={text.caption}>
                Deploy your smart contract using the Foundry toolkit
              </div>
              <Button
                className="mt-4"
                variant="contained"
                color="primary"
                fullWidth
                maxWidth="xs"
                component={Link}
                external
                href="https://github.com/worldcoin/world-id-starter"
              >
                Go to Foundry starter kit
              </Button>
            </div>
          </div>

          <JSWidgetInstructions action_id={currentAction.id} />

          <div className="grid grid-cols-auto/1fr items-center gap-x-5">
            <Icon name="checkmark-selected" className="w-6 h-6 text-primary" />
            <span className="font-semibold">
              Send the proof to your smart contract with a regular wallet
              transaction
            </span>
          </div>

          <Button
            id="saveActionUserInterface"
            className="justify-self-end"
            color="primary"
            variant="contained"
            fullWidth
            maxWidth="xs"
            onClick={() => enableUserInterface("widget")}
          >
            I&apos;ve done this
          </Button>
        </div>
      </Widget>
    </div>
  );
}
