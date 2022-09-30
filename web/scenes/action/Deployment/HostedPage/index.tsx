import { Fragment, useCallback, useEffect, useState } from "react";
import { Widget } from "common/Widget";
import { Overview } from "../../common/Overview";
import { Progress } from "../../common/Progress";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldInputAddon } from "common/FieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { FieldError } from "common/FieldError";
import { useActions, useValues } from "kea";
import { Field, Form } from "kea-forms";
import { actionLogic } from "logics/actionLogic";
import { HostedPageInstructions } from "./Instructions";

export function HostedPage(props: { actionId: string }) {
  const { actionUrls, currentActionLoading, hostedPageSteps } =
    useValues(actionLogic);
  const { enableUserInterface } = useActions(actionLogic);

  const [hostedPageUrlCopied, setHostedPageUrlCopied] = useState(false);

  useEffect(() => {
    if (hostedPageUrlCopied) {
      const timer = setTimeout(() => setHostedPageUrlCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hostedPageUrlCopied]);

  const copyHostedPageUrlToClipboard = useCallback(() => {
    if (actionUrls?.hostedPage) {
      navigator.clipboard
        .writeText(actionUrls.hostedPage)
        .then(() => setHostedPageUrlCopied(true));
    }
  }, [actionUrls?.hostedPage]);

  return (
    <Fragment>
      {hostedPageSteps.currentStep !==
        hostedPageSteps.steps[hostedPageSteps.steps.length - 1] && (
        <Widget title="Deployment progress" className="mt-4">
          <Progress
            steps={hostedPageSteps.steps}
            currentStep={hostedPageSteps.currentStep}
          />
        </Widget>
      )}

      <Widget
        title="Overview"
        opened={hostedPageSteps.currentStep.value === "configure"}
        expandable
      >
        <Overview
          items={[
            {
              icon: "overview-request",
              text: "You redirect the user to our URL",
            },
            {
              icon: "overview-qr",
              text: "User verifies with World ID on your site",
            },
            {
              icon: "overview-response",
              text: "We redirect the user back to your site",
            },
            {
              icon: "overview-signature",
              text: "You verify the response (JWT signature)",
            },
          ]}
        />
      </Widget>

      <Widget
        title="Configuration"
        opened={["configure", "live"].includes(
          hostedPageSteps.currentStep.value
        )}
        expandable
      >
        <Form
          logic={actionLogic}
          formKey="hostedPageConfig"
          enableFormOnSubmit
          className="grid gap-y-12"
        >
          <FieldGroup label="Hosted page URL">
            <FieldInput
              type="text"
              name="hostedPageUrl"
              readOnly
              defaultValue={actionUrls?.hostedPage}
              addon={
                <FieldInputAddon>
                  <FieldInputAddonAction onClick={copyHostedPageUrlToClipboard}>
                    {hostedPageUrlCopied ? (
                      <Icon name="check" className="w-6 h-6 text-success" />
                    ) : (
                      <Icon name="copy" className="w-6 h-6" />
                    )}
                  </FieldInputAddonAction>
                </FieldInputAddon>
              }
            />
            <div className="-mt-2 text-14 text-neutral">
              This is where the user will be redirected upon successful
              verification.
            </div>
          </FieldGroup>

          <Field name="return_url" noStyle>
            {({ value, onChange, error }) => (
              <FieldGroup label="Return URL">
                <FieldInput
                  type="text"
                  name="return_url"
                  placeholder="https://myapp.com/world-id-verified"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={currentActionLoading}
                />
                {error ? (
                  <FieldError className="-mt-2">{error}</FieldError>
                ) : (
                  <div className="-mt-2 text-14 text-neutral">
                    This is where we'll redirect the user after verification.
                  </div>
                )}
              </FieldGroup>
            )}
          </Field>

          <div className="flex justify-end">
            <Button
              variant="contained"
              color="primary"
              fullWidth
              maxWidth="xs"
              type="submit"
              disabled={currentActionLoading}
            >
              Save configuration
            </Button>
          </div>
        </Form>
      </Widget>

      <Widget
        title="Deployment instructions"
        opened={hostedPageSteps.currentStep.value !== "live"}
        expandable
      >
        <HostedPageInstructions
          actionId={props.actionId}
          hostedPageUrl={actionUrls?.hostedPage}
        />

        <Button
          id="saveActionUserInterface"
          className="max-w-xs mt-4"
          variant="contained"
          color="primary"
          fullWidth
          disabled={currentActionLoading}
          onClick={() => enableUserInterface("hosted_page")}
          component="a"
        >
          I've done this
        </Button>
      </Widget>
    </Fragment>
  );
}
