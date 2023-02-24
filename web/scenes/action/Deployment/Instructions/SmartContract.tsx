import { memo } from "react";
import { text } from "common/styles";
import { Button } from "common/LegacyButton";
import { Link } from "common/components/Link";

export const SmartContractInstructions = memo(
  function SmartContractInstructions() {
    return (
      <>
        <h2 className="font-sora font-semibold text-20 leading-6 text-primary">
          Fork our starter kit to create your smart contract
        </h2>

        <div className="flex mt-4">
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
      </>
    );
  }
);
