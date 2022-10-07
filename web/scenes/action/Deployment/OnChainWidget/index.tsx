import { Widget } from "common/Widget";
import { useCallback, useState } from "react";
import { ProgressStep } from "scenes/action/types/progress-step";
import { Select } from "common/Select";
import { SelectItem } from "common/types/select-item";
import { Contracts } from "./Contracts";
import { useActions, useValues } from "kea";
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
  const { updateAction } = useActions(actionLogic);

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

  if (!currentAction) {
    return null;
  }

  return (
    <div className="grid gap-y-6">
      <Widget title="Contracts" opened expandable>
        <Contracts />
      </Widget>

      {/*<Widget*/}
      {/*  expandable*/}
      {/*  opened*/}
      {/*  title="Overview"*/}
      {/*  description="On-chain deployment"*/}
      {/*>*/}
      {/*  <Overview*/}
      {/*    items={[*/}
      {/*      { icon: "overview-js", text: "Your dapp shows the JS widget" },*/}

      {/*      {*/}
      {/*        icon: "overview-qr",*/}
      {/*        text: (*/}
      {/*          <span>*/}
      {/*            User verifies with World ID on{" "}*/}
      {/*            <span className="font-semibold">your</span> site*/}
      {/*          </span>*/}
      {/*        ),*/}
      {/*      },*/}

      {/*      {*/}
      {/*        icon: "overview-proof",*/}
      {/*        text: "Your dapp sends the proof to your smart contract",*/}
      {/*      },*/}

      {/*      {*/}
      {/*        icon: "overview-contract",*/}
      {/*        text: "Your smart contract calls our contract to verify the proof and executes",*/}
      {/*      },*/}
      {/*    ]}*/}
      {/*  />*/}
      {/*</Widget>*/}

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
    </div>
  );
}
