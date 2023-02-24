import cn from "classnames";
import { CardWithSideGradient } from "common/CardWithSideGradient";
import { InputError } from "common/InputError";
import { Layout } from "common/Layout";
import { Field, Form } from "kea-forms";
import { appsLogic } from "logics/appsLogic";
import { memo } from "react";
import { styles } from "common/styles";
import { useValues } from "kea";
import { Button } from "common/LegacyButton";

export const NewApp = memo(function NewApp() {
  const { newAppHasErrors, newAppTouched, isNewAppSubmitting } =
    useValues(appsLogic);

  const isDisabled = (newAppHasErrors && newAppTouched) || isNewAppSubmitting;

  return (
    <Layout>
      <div className="grid gap-y-8">
        <CardWithSideGradient>
          <h1 className="text-30 font-sora leading-none font-semibold py-1">
            New app
          </h1>

          {/* REVIEW: description  */}
          <p>Create your new awesome app</p>
        </CardWithSideGradient>

        <Form
          className="grid gap-y-8 justify-items-end"
          logic={appsLogic}
          formKey={"newApp"}
          enableFormOnSubmit
        >
          <label className="grid gap-y-4 font-rubik leading-tight w-full">
            <span className="text-16 font-medium">Name</span>
            <Field noStyle name="name">
              {({ value, onChange, error }) => (
                <div className="grid gap-y-2">
                  <input
                    type="text"
                    name="name"
                    className={cn("p-5 text-14 w-full", styles.container.flat, {
                      "border-ff5a76": error,
                    })}
                    onChange={(e) => onChange(e.target.value)}
                    value={value}
                    autoFocus
                  />

                  <InputError error={error} />
                </div>
              )}
            </Field>
          </label>

          <Button
            type="submit"
            disabled={isDisabled}
            maxWidth="xs"
            fullWidth
            color="primary"
            variant="contained"
          >
            create app
          </Button>
        </Form>
      </div>
    </Layout>
  );
});
