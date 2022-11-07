import { CardWithSideGradient } from "common/CardWithSideGradient";
import { Layout } from "common/Layout";
import { Fragment } from "react";
import cn from "classnames";
import { styles, text } from "common/styles";
import { Widget } from "common/Widget";
import { Field, Form } from "kea-forms";
import { InputError } from "common/InputError";
import { debuggerLogic } from "logics/debuggerLogic";
import { Checkbox } from "common/components/Checkbox";
import { Button } from "common/Button";
import { useToggle } from "common/hooks";
import { Icon } from "common/Icon";
import { useValues } from "kea";

const ERROR_DETAILS: Record<string, string | JSX.Element> = {
  invalid_merkle_root: (
    <>
      Looks like the identity is not verified by World ID. If you verified with
      the <b>simulator</b>, make sure you set the environment to <b>staging</b>.
    </>
  ),
  invalid_proof:
    "Looks like your proof is invalid. The signal may be wrong or there might be an encoding issue with some parameter.",
  invalid:
    "We do not know what went wrong, but something did. Your proof may be okay, but we cannot verify it. Please check the console and try again.",
};

function ResultBox(): JSX.Element | null {
  const { verificationResult } = useValues(debuggerLogic);
  if (!verificationResult) {
    return <div className="text-neutral">Debugger not run yet.</div>;
  }

  const errorCode = verificationResult.code ?? "invalid";
  const color = verificationResult.success ? "success" : "warning";
  const title = verificationResult.success
    ? "All good, fren!"
    : "Emm... your proof is not valid ser";
  const caption = verificationResult.success
    ? "🎉🎉 Hooray for zero-knowledge proofs, your proof is 100% valid."
    : ERROR_DETAILS[errorCode];

  // TODO: Warning states for improper encoding #ffc700
  return (
    <div
      className={`flex border border-${color} bg-${color} bg-opacity-10 rounded-xl p-4`}
    >
      <div className="pr-4">
        <Icon name="warning" className={`w-6 h-6 text-${color}`} />
      </div>
      <div>
        <h3 className={`text-${color} text-xl font-bold`}>{title}</h3>
        <div className="text-neutral">{caption}</div>
      </div>
    </div>
  );
}

export function Debugger(): JSX.Element {
  const envSelect = useToggle();
  const { environments, debuggerForm, isDebuggerFormSubmitting } =
    useValues(debuggerLogic);

  return (
    <Fragment>
      <Layout title="Debugger">
        <CardWithSideGradient>
          <h1 className={cn(text.h1)}>Proof debugger</h1>
          <p className="mt-2 leading-4 font-sora text-14 text-neutral">
            This will check all your parameters and validate a World ID ZKP with
            the official smart contract.
          </p>
        </CardWithSideGradient>

        <Form
          className="grid grid-cols-10 gap-4"
          logic={debuggerLogic}
          formKey="debuggerForm"
          enableFormOnSubmit
        >
          <div className="col-span-6">
            <Widget
              className="mt-8"
              title="Input parameters"
              description="Parameters you send to the JS widget"
            >
              <label className="grid leading-tight w-full">
                <span className="text-16 font-medium">Action ID</span>
                <Field noStyle name="action_id">
                  {({ value, onChange, error }) => (
                    <>
                      <input
                        type="text"
                        name="action_id"
                        className={cn(
                          "p-5 text-14 w-full",
                          styles.container.flat,
                          {
                            "border-ff5a76": error,
                          }
                        )}
                        onChange={(e) => onChange(e.target.value)}
                        value={value}
                        autoFocus
                        placeholder="wid_7fa9fec9fe0de"
                        disabled={isDebuggerFormSubmitting}
                      />

                      {error && (
                        <div className="mt-2 mb-2">
                          <InputError error={error} />
                        </div>
                      )}
                    </>
                  )}
                </Field>
              </label>

              <div className="mb-8 mt-2">
                <Field noStyle name="advanced_use_raw_action_id">
                  {({ value, onChange }) => (
                    <Checkbox
                      checked={value}
                      onChange={onChange}
                      disabled={isDebuggerFormSubmitting}
                      label={
                        <span>
                          <b>Advanced.</b> Use raw action ID
                        </span>
                      }
                    />
                  )}
                </Field>
              </div>

              <label className="grid gap-y-4 leading-tight w-full">
                <span className="text-16 font-medium">Signal</span>
                <Field noStyle name="signal">
                  {({ value, onChange, error }) => (
                    <div className="grid gap-y-2">
                      <input
                        type="text"
                        name="signal"
                        className={cn(
                          "p-5 text-14 w-full",
                          styles.container.flat,
                          {
                            "border-ff5a76": error,
                          }
                        )}
                        onChange={(e) => onChange(e.target.value)}
                        value={value}
                        placeholder="mySignal"
                        disabled={isDebuggerFormSubmitting}
                      />

                      {error && (
                        <div className="mt-2 mb-2">
                          <InputError error={error} />
                        </div>
                      )}
                    </div>
                  )}
                </Field>
              </label>

              <div className="mb-8 mt-2">
                <Field noStyle name="advanced_use_raw_signal">
                  {({ value, onChange }) => (
                    <Checkbox
                      checked={value}
                      onChange={onChange}
                      disabled={isDebuggerFormSubmitting}
                      label={
                        <span>
                          <b>Advanced.</b> Use raw signal
                        </span>
                      }
                    />
                  )}
                </Field>
              </div>

              <Field noStyle name="environment">
                {({ value, onChange, error }) => (
                  <label
                    className={cn(
                      "field grid gap-y-4 font-rubik leading-tight z-10",
                      { "field-error": error }
                    )}
                  >
                    <div className="grid gap-y-2">
                      <span className="text-16 font-medium">Environment</span>
                    </div>
                    <div className="grid gap-y-2">
                      <div className="w-full h-[64px]">
                        <ul
                          className={cn(
                            "relative cursor-pointer overflow-hidden select-none transition-all",
                            styles.container.flat,
                            { "max-h-[64px]": !envSelect.isOn },
                            { "max-h-[1000px]": envSelect.isOn }
                          )}
                          onClick={envSelect.toggle}
                        >
                          {environments.map((environment, index) => (
                            <li
                              key={`environment-${index}`}
                              value={environment.value}
                              className={cn(
                                "p-5 grid grid-cols-auto/1fr items-center gap-x-3",
                                {
                                  "hover:bg-neutral-muted":
                                    value !== environment.value,
                                }
                              )}
                              onClick={() => onChange(environment.value)}
                            >
                              <Icon
                                name={environment.icon.name}
                                className="w-6 h-6 text-primary"
                              />
                              <span>{environment.name}</span>
                            </li>
                          ))}
                          <Icon
                            name="angle-down"
                            className="w-6 h-6 absolute top-5 right-5"
                          />
                        </ul>
                      </div>

                      <InputError error={error} />
                    </div>
                  </label>
                )}
              </Field>
            </Widget>

            <Widget
              className="mt-8"
              title="Output parameters"
              description="Params you get from the JS widget. Just paste the object below."
            >
              <Field noStyle name="verificationResponse">
                {({ value, onChange, error }) => (
                  <>
                    <textarea
                      name="verificationResponse"
                      className={cn(
                        "p-5 text-14 w-full font-ibm bg-neutral-muted bg-opacity-40",
                        styles.container.flat,
                        {
                          "border-ff5a76": error,
                        }
                      )}
                      rows={7}
                      onChange={(e) => onChange(e.target.value)}
                      value={value}
                      placeholder={`{\n  "proof": "0x",\n  "merkle_root": "0x",\n  "nullifier_hash": "0x"\n}`}
                      disabled={isDebuggerFormSubmitting}
                    ></textarea>

                    {error && (
                      <div className="mt-2 mb-2">
                        <InputError error={error} />
                      </div>
                    )}
                  </>
                )}
              </Field>
            </Widget>
          </div>

          <div className="col-span-4">
            <Widget className="mt-8" title="Debugging results">
              <ResultBox />

              <Button
                type="submit"
                disabled={isDebuggerFormSubmitting}
                maxWidth="xs"
                fullWidth
                color="primary"
                variant="contained"
                className="mt-8"
              >
                validate proof
              </Button>
            </Widget>
          </div>
        </Form>
      </Layout>
    </Fragment>
  );
}
