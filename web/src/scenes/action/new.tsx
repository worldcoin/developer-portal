import cn from "classnames";
import { useToggle } from "src/hooks/useToggle";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { Button } from "src/components/LegacyButton";
import { styles } from "src/components/styles";
import { CheckboxCard } from "./CheckboxCard";
import { Layout } from "src/components/Layout";
import { Form, Field } from "kea-forms";
import { useActions, useValues } from "kea";
import { InputError } from "src/components/InputError";
import { actionsLogic } from "src/logics/actionsLogic";
import { appsLogic } from "src/logics/appsLogic";
import { FormEventHandler, useCallback, useRef } from "react";
import { Header } from "src/components/Header";
import { HeaderText } from "src/components/HeaderText";
import { Footer } from "src/components/Footer";

export function NewAction() {
  const {
    newActionHasErrors,
    newActionTouched,
    isNewActionSubmitting,
    newActionEnvironments,
  } = useValues(actionsLogic);

  const { submitNewAction } = useActions(actionsLogic);
  const { apps } = useValues(appsLogic);

  const isDisabled =
    (newActionHasErrors && newActionTouched) || isNewActionSubmitting;

  const appSelect = useToggle();
  const envSelect = useToggle();

  // Custom submit handler that scrolls to first error field
  const formWrapperReference = useRef<HTMLDivElement>(null);
  const handleSubmitForm: FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.preventDefault();
      submitNewAction();

      // There is no callback that's triggered after form validation
      setTimeout(
        () =>
          formWrapperReference.current
            ?.querySelector(".field-error")
            ?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    },
    [submitNewAction]
  );

  return (
    <Layout title="New Action" mainClassName="p-0 lg:p-0 xl:p-0 flex flex-col">
      <Header>
        <HeaderText
          title="Create New Action"
          description="An action is something that any human can only perform once."
        />
      </Header>

      <div className="grow flex flex-col" ref={formWrapperReference}>
        <Form
          className="grow flex flex-col"
          logic={actionsLogic}
          formKey="newAction"
          enableFormOnSubmit
          onSubmit={handleSubmitForm}
        >
          <h2 className="mx-4 lg:mx-8 xl:mx-16 mt-6 mb-3 font-sora font-semibold text-16 leading-5">
            Action Info
          </h2>

          <div className="mx-4 lg:mx-8 xl:mx-16 mb-6 p-8 bg-ffffff border border-neutral-muted rounded-xl">
            <Field noStyle name="name">
              {({ value, onChange, error }) => (
                <label
                  className={cn("grid gap-y-2 mb-4 leading-tight", {
                    "field-error": error,
                  })}
                >
                  <span className="text-14 font-medium">Action Name</span>
                  <div className="grid gap-y-2">
                    <input
                      type="text"
                      name="name"
                      className={cn(
                        "px-5 py-3 text-14 w-full",
                        styles.container.flat,
                        {
                          "border-danger": error,
                        }
                      )}
                      onChange={(e) => onChange(e.target.value)}
                      value={value}
                      autoFocus
                    />

                    {!!error && <InputError error={error} />}
                  </div>
                </label>
              )}
            </Field>

            <Field noStyle name="description">
              {({ value, onChange, error }) => (
                <label
                  className={cn("grid gap-y-2 mb-4 leading-tight", {
                    "field-error": error,
                  })}
                >
                  <span className="text-14 font-medium">
                    Description (internal)
                  </span>
                  <div className="grid gap-y-2">
                    <input
                      type="text"
                      name="description"
                      className={cn(
                        "px-5 py-3 text-14 w-full",
                        styles.container.flat
                      )}
                      onChange={(e) => onChange(e.target.value)}
                      defaultValue={value}
                    />

                    {!!error && <InputError error={error} />}
                  </div>
                </label>
              )}
            </Field>

            <Field noStyle name="app_id">
              {({ value, onChange, error }) => (
                <label
                  className={cn("grid gap-y-2 mb-4 leading-tight z-20", {
                    "field-error": error,
                  })}
                >
                  <div className="grid gap-y-2">
                    <span className="text-14 font-medium">Select an App</span>
                  </div>
                  <div className="grid gap-y-2">
                    <div className="w-full h-[44px]">
                      <ul
                        className={cn(
                          "relative grid cursor-pointer overflow-hidden select-none transition-all",
                          styles.container.flat,
                          { "h-[44px]": !appSelect.isOn },
                          { "max-h-[1000px] z-dropdown": appSelect.isOn }
                        )}
                        onClick={appSelect.toggle}
                      >
                        {!value && (
                          <li className="grid items-center h-[44px] px-5 text-neutral">
                            Please select an app...
                          </li>
                        )}
                        {apps.map((app, index) => (
                          <li
                            key={`app-${index}`}
                            value={app.id}
                            className={cn(
                              "h-[44px] px-5 grid grid-cols-auto/1fr items-center gap-x-3",
                              {
                                "-order-1": value === app.id,
                                "hover:bg-f0edf9": value !== app.id,
                              }
                            )}
                            onClick={() => onChange(app.id)}
                          >
                            {/* TODO: add app logo here */}
                            <span>{app.name}</span>
                          </li>
                        ))}
                        <li className={cn("hover:bg-f0edf9")}>
                          <Link
                            className="h-[44px] px-5 grid grid-cols-auto/1fr items-center gap-x-3"
                            href="/apps/new"
                          >
                            Create New App
                            <Icon name="plus" className="w-4 h-4" />
                          </Link>
                        </li>
                        <Icon
                          name="angle-down"
                          className="w-6 h-6 absolute top-2.5 right-5"
                        />
                      </ul>
                    </div>

                    {!!error && <InputError error={error} />}
                  </div>
                </label>
              )}
            </Field>

            <Field noStyle name="environment">
              {({ value, onChange, error }) => (
                <label
                  className={cn("field grid gap-y-2 leading-tight z-10", {
                    "field-error": error,
                  })}
                >
                  <div className="grid gap-y-1">
                    <span className="text-14 font-medium">Environment</span>
                    <div className="text-14">
                      <span className="text-neutral">
                        Use staging if you want to test.{" "}
                      </span>
                      <span>This cannot be changed later.</span>
                    </div>
                  </div>
                  <div className="grid gap-y-2">
                    <div className="w-full h-[44px]">
                      <ul
                        className={cn(
                          "relative cursor-pointer overflow-hidden select-none transition-all",
                          styles.container.flat,
                          { "max-h-[44px]": !envSelect.isOn },
                          { "max-h-[1000px] z-dropdown": envSelect.isOn }
                        )}
                        onClick={envSelect.toggle}
                      >
                        {!value && (
                          <li className="grid items-center h-[44px] px-5 text-neutral">
                            Please select a environment...
                          </li>
                        )}
                        {newActionEnvironments.map((environment, index) => (
                          <li
                            key={`environment-${index}`}
                            value={environment.value}
                            className={cn(
                              "h-[44px] px-5 grid grid-cols-auto/1fr items-center gap-x-3",
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
                          className="w-6 h-6 absolute top-2.5 right-5"
                        />
                      </ul>
                    </div>

                    {!!error && <InputError error={error} />}
                  </div>
                </label>
              )}
            </Field>
          </div>

          <Field noStyle name="engine">
            {({ value, onChange, error }) => (
              <div
                className={cn(
                  "mx-4 lg:mx-8 xl:mx-16 grid gap-y-2 leading-tight",
                  {
                    "field-error": error,
                  }
                )}
              >
                <div className="grid gap-y-1">
                  <span className="text-16 font-medium">Select Engine</span>
                  <div className="grid grid-flow-col justify-between">
                    <div className="text-14">
                      <span className="text-neutral">
                        Where will proofs be processed and stored?{" "}
                      </span>
                      <span>This cannot be changed later.</span>
                    </div>

                    <Link
                      href="/"
                      className="grid grid-cols-1fr/auto justify-center items-center"
                    >
                      <span>Learn more</span>
                      <Icon name="angle-down" className="w-6 h-6 -rotate-90" />
                    </Link>
                  </div>
                </div>
                <div className="grid gap-y-2">
                  <div className="grid grid-cols-2 gap-x-8">
                    <CheckboxCard
                      icon="cloud"
                      title="Cloud"
                      name="engine"
                      value="cloud"
                      description="For actions that are triggered with an API or are used in person."
                      list={[
                        <>
                          Proofs are submitted to this portal and you can
                          confirm validity with an <b>API&nbsp;request</b> or{" "}
                          <b>verifying a JWT</b> signature.
                        </>,
                        <>
                          Show the World ID widget on your site, redirect the
                          user to our <b>hosted page</b>, or&nbsp;use our{" "}
                          <b>Kiosk mode</b> for in-person verification.
                        </>,
                      ]}
                      stamp="Easiest"
                      currentValue={value}
                      onChange={onChange}
                    />

                    <CheckboxCard
                      icon="on-chain"
                      title="On-chain"
                      name="engine"
                      value="on-chain"
                      description="For actions that are validated and executed on chain."
                      list={[
                        <>
                          If your execution happens{" "}
                          <b>on-chain (e.g. airdrop, NFT issuing, ...)</b>
                        </>,
                        <>
                          <b>Proof validation and uniqueness</b> verification
                          on-chain.
                        </>,
                        <>
                          Your <b>smart contract connects to our Semaphore</b>{" "}
                          contract to verify the proof.
                        </>,
                      ]}
                      currentValue={value}
                      onChange={onChange}
                    />
                  </div>

                  <InputError error={error} />
                </div>
              </div>
            )}
          </Field>

          <div className="grow" />

          <Footer>
            <p className="text-14 text-neutral">
              You need to fill action info and select an engine to continue.
            </p>
            <Button
              className="justify-self-end"
              color="primary"
              variant="contained"
              fullWidth
              maxWidth="xs"
              type="submit"
              disabled={isDisabled}
            >
              create action
            </Button>
          </Footer>
        </Form>
      </div>
    </Layout>
  );
}
