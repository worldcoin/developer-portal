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

export function Debugger(): JSX.Element {
  const envSelect = useToggle();
  const { environments } = useValues(debuggerLogic);

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
          className="grid grid-cols-6 gap-4"
          logic={debuggerLogic}
          formKey="debuggerForm"
          enableFormOnSubmit
        >
          <div className="col-span-4">
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
                        autoFocus
                        placeholder="mySignal"
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
          </div>

          <div className="col-span-2">
            <Widget className="mt-8" title="Debugging results">
              Debugger not run yet.
              <Button
                type="submit"
                //disabled={isDisabled}
                maxWidth="xs"
                fullWidth
                color="primary"
                variant="contained"
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
