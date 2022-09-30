import { Button } from "common/Button";
import { useValues } from "kea";
import { Form, Field as KeaFormField } from "kea-forms";
import { actionLogic } from "logics/actionLogic";
import { authLogic } from "logics/authLogic";
import { Fragment, useMemo } from "react";
import { memo } from "react";
import { Field } from "./Field";

export const Contracts = memo(function Contracts() {
  const { contracts } = useValues(authLogic);
  const { currentAction, chainUrlAddress } = useValues(actionLogic);

  const contract = useMemo(
    () =>
      (currentAction &&
        contracts.filter(
          (contract) =>
            currentAction.is_staging === contract.key.startsWith("staging")
        )[0]?.value) ||
      undefined,
    [contracts, currentAction]
  );

  if (!currentAction) {
    return null;
  }

  return (
    <Form
      className="grid gap-y-6"
      enableFormOnSubmit
      formKey="contractsConfig"
      logic={actionLogic}
    >
      <KeaFormField name="smart_contract_address" noStyle>
        {({ onChange, error }) => (
          <Fragment>
            <Field
              defaultValue={currentAction.smart_contract_address}
              description="Store your contract address for easy access"
              error={error}
              linkText="View on Polygonscan"
              name="smart_contract_address"
              onChange={(e) => onChange(e.target.value)}
              title="Your smart contract"
              type="text"
              url={chainUrlAddress}
            />
          </Fragment>
        )}
      </KeaFormField>

      <Field
        defaultValue={contract}
        description="Proof verification contract"
        linkText="View on Polygonscan"
        readOnly
        title="Worldcoin contract"
      />

      <Button
        className="justify-self-end"
        color="primary"
        fullWidth
        maxWidth="xs"
        type="submit"
        variant="contained"
      >
        Save changes
      </Button>
    </Form>
  );
});
