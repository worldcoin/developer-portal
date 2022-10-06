import { useActions, useValues } from "kea";
import { actionLogic } from "logics/actionLogic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { userInterfaces, UserInterfacesType } from "types";
import { HostedPage } from "./HostedPage";
import cn from "classnames";
import { Button } from "common/Button";
import { FieldInput } from "common/FieldInput";
import { Interface } from "./Interface";
import { KioskAccess } from "./Kiosk/Access";
import { OnChainWidget } from "./OnChainWidget";
import { Field, Form } from "kea-forms";
import { Footer } from "common/Footer";

export function Deployment() {
  const {
    interfaceConfig,
    currentAction,
    actionUrls,
    deploymentSteps,
    interfaceConfigLoading,
  } = useValues(actionLogic);

  const isInterfaceEnabled = useCallback(
    (userInterface: UserInterfacesType) => interfaceConfig[userInterface],
    [interfaceConfig]
  );

  if (!currentAction) {
    return null;
  }

  return (
    <div className="grid">
      <h2 className="mt-6 mb-3 font-sora font-semibold text-16 leading-5">
        General
      </h2>

      {!interfaceConfigLoading && (
        <Form logic={actionLogic} formKey="interfaceConfig" enableFormOnSubmit>
          <div className="mb-6 p-8 bg-ffffff border border-neutral-muted rounded-xl">
            <div className="grid gap-y-2">
              <div className="grid grid-cols-1fr/auto">
                <label
                  className="grid grid-flow-row gap-y-1 text-14 leading-4"
                  htmlFor={`${Deployment.name}-publicDescription`}
                >
                  <span
                    className={cn(
                      "inline-grid grid-flow-col gap-x-0.5 justify-start font-semibold",
                      "after:inline-block after:w-1.5 after:h-1.5 after:rounded-full after:bg-ff6848"
                    )}
                  >
                    Public description
                  </span>
                  <span className="font-normal text-neutral">
                    This description will show up on the Worldcoin app.
                  </span>
                </label>
                <Button
                  className="h-[34px] px-3 !font-rubik !font-medium border-primary/10 bg-primary/5"
                  variant="outlined"
                  color="primary"
                  size="md"
                  type="button"
                >
                  Preview Worldcoin App
                </Button>
              </div>

              <Field noStyle name="public_description">
                {({ value, onChange, error }) => (
                  <FieldInput
                    className="!h-[44px] !px-4"
                    variant="small"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    name="public_description"
                    error={error}
                    type="text"
                  />
                )}
              </Field>
            </div>
          </div>

          <h2 className="mt-6 mb-1 font-sora font-semibold text-16 leading-5">
            Interface configuration
          </h2>
          <p className="mb-3 text-14 leading-4 text-neutral">
            How your users interact with this action.
          </p>

          {currentAction.engine === "cloud" ? (
            <Interface
              name="widget"
              icon="api"
              title="API & JS widget"
              description="Add the JS widget to your website and verify proofs with our API."
              enabled={isInterfaceEnabled("widget")}
              overviewItems={[
                {
                  icon: "overview-1",
                  text: (
                    <>
                      Your app shows the
                      <br />
                      JS widget
                    </>
                  ),
                },
                {
                  icon: "overview-2",
                  text: (
                    <>
                      User verifies with
                      <br />
                      World ID on your site
                    </>
                  ),
                },
                {
                  icon: "overview-3",
                  text: (
                    <>
                      Your backend sends
                      <br />
                      the proof to our API
                    </>
                  ),
                },
                {
                  icon: "overview-4",
                  text: (
                    <>
                      Our API verifies the proof and
                      <br />
                      your backend executes action
                    </>
                  ),
                },
              ]}
            />
          ) : (
            <Interface
              name="widget"
              icon="api"
              title="Smart contract & JS widget"
              description="Add the JS widget to your website and verify proofs with our API."
              enabled={isInterfaceEnabled("widget")}
              overviewItems={[
                {
                  icon: "overview-1",
                  text: (
                    <>
                      Your app shows the
                      <br />
                      JS widget
                    </>
                  ),
                },
                {
                  icon: "overview-2",
                  text: (
                    <>
                      User verifies with
                      <br />
                      World ID on your site
                    </>
                  ),
                },
                {
                  icon: "overview-3",
                  text: (
                    <>
                      Your backend sends
                      <br />
                      the proof to our API
                    </>
                  ),
                },
                {
                  icon: "overview-4",
                  text: (
                    <>
                      Our API verifies the proof and
                      <br />
                      your backend executes action
                    </>
                  ),
                },
              ]}
            >
              {isInterfaceEnabled("widget") && <OnChainWidget />}
            </Interface>
          )}

          <Interface
            name="hosted_page"
            icon="window"
            title="Hosted page"
            description="Redirect the user to our page for verification, we’ll redirect the user back upon success."
            enabled={isInterfaceEnabled("hosted_page")}
            overviewItems={[
              {
                icon: "overview-1",
                text: "You redirect the user to our URL",
              },
              {
                icon: "overview-2",
                text: "User verifies with World ID on your site",
              },
              {
                icon: "overview-3",
                text: "We redirect the user back to your site",
              },
              {
                icon: "overview-4",
                text: "You verify the response (JWT signature)",
              },
            ]}
          >
            {isInterfaceEnabled("kiosk") && (
              <HostedPage actionId={currentAction.id} />
            )}
          </Interface>

          {currentAction.engine === "cloud" && (
            <Interface
              name="kiosk"
              icon="kiosk"
              title="Kiosk"
              description="Verify users in-person right here. No code needed."
              enabled={isInterfaceEnabled("kiosk")}
              overviewItems={[
                { icon: "overview-1", text: "You open the Kiosk page" },
                {
                  icon: "overview-2",
                  text: "User scans QR code from the Kiosk",
                },
                {
                  icon: "overview-3",
                  text: "You receive confirmation immediately",
                },
                {
                  icon: "overview-4",
                  text: (
                    <>
                      Restart.
                      <br />
                      Verify another user.
                    </>
                  ),
                },
              ]}
            >
              {isInterfaceEnabled("kiosk") && (
                <KioskAccess
                  deploymentStep={deploymentSteps?.kiosk}
                  url={actionUrls?.kiosk}
                />
              )}
            </Interface>
          )}
        </Form>
      )}
    </div>
  );
}
