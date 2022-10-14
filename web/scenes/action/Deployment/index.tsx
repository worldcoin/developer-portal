import { useValues } from "kea";
import { actionLogic } from "logics/actionLogic";
import { useCallback } from "react";
import { useToggle } from "common/hooks";
import { UserInterfacesType } from "types";
import { HostedPage } from "./HostedPage";
import cn from "classnames";
import { Button } from "common/Button";
import { FieldInput } from "common/FieldInput";
import { Interface } from "./Interface";
import { Kiosk } from "./Kiosk";
import { OnChainWidget } from "./OnChainWidget";
import { Field, Form } from "kea-forms";
import { CloudWidgetInstructions } from "./CloudWidget/Instructions";
import { HostedPageInstructions } from "./HostedPage/Instructions";
import { Modal } from "common/Modal";
import { Preview } from "common/Preview";
import { OnChainWidgetInstructions } from "./OnChainWidget/Instructions";

export function Deployment() {
  const { interfaceConfig, currentAction, actionUrls, interfaceConfigLoading } =
    useValues(actionLogic);

  const isInterfaceEnabled = useCallback(
    (userInterface: UserInterfacesType) => interfaceConfig[userInterface],
    [interfaceConfig]
  );

  const previewModal = useToggle();

  if (!interfaceConfig || !currentAction) {
    return null;
  }

  return (
    <div className="grid">
      <h2 className="mt-6 mb-3 font-sora font-semibold text-16 leading-5">
        General
      </h2>

      {!interfaceConfigLoading && (
        <Form
          className="min-w-0"
          logic={actionLogic}
          formKey="interfaceConfig"
          enableFormOnSubmit
        >
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
                      {
                        "after:inline-block after:w-1.5 after:h-1.5 after:rounded-full after:bg-ff6848":
                          currentAction.user_interfaces.enabled_interfaces
                            ?.length === 0 || !currentAction.public_description,
                      }
                    )}
                  >
                    Public description
                  </span>
                  <span className="font-normal text-neutral">
                    This description will show up on the Worldcoin app.
                  </span>
                </label>
                <Button
                  className="h-[34px] !font-rubik !font-medium border-primary/10 bg-primary/5"
                  variant="outlined"
                  color="primary"
                  size="md"
                  type="button"
                  onClick={previewModal.toggleOn}
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
                  icon: "overview-js",
                  text: (
                    <>
                      Your app shows the
                      <br />
                      JS widget
                    </>
                  ),
                },
                {
                  icon: "overview-qr",
                  text: (
                    <>
                      User verifies with
                      <br />
                      World ID on your site
                    </>
                  ),
                },
                {
                  icon: "overview-proof",
                  text: (
                    <>
                      Your backend sends
                      <br />
                      the proof to our API
                    </>
                  ),
                },
                {
                  icon: "overview-backend",
                  text: (
                    <>
                      Our API verifies the proof and
                      <br />
                      your backend executes action
                    </>
                  ),
                },
              ]}
              instructions={
                <CloudWidgetInstructions actionId={currentAction.id} />
              }
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
                  icon: "overview-js",
                  text: (
                    <>
                      Your app shows the
                      <br />
                      JS widget
                    </>
                  ),
                },
                {
                  icon: "overview-qr",
                  text: (
                    <>
                      User verifies with
                      <br />
                      World ID on your site
                    </>
                  ),
                },
                {
                  icon: "overview-proof",
                  text: <>Your dapp sends the proof to your smart contract</>,
                },
                {
                  icon: "overview-contract",
                  text: (
                    <>
                      Your smart contract calls our contract to verify the proof
                      and executes
                    </>
                  ),
                },
              ]}
              instructions={
                <OnChainWidgetInstructions actionId={currentAction.id} />
              }
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
            instructions={
              <HostedPageInstructions actionId={currentAction.id} />
            }
          >
            {isInterfaceEnabled("hosted_page") && (
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
                { icon: "kiosk-qr-page", text: "You open the Kiosk page" },
                {
                  icon: "kiosk-qr-mobile",
                  text: "User scans QR code from the Kiosk",
                },
                {
                  icon: "kiosk-success-page",
                  text: "You receive confirmation immediately",
                },
                {
                  icon: "kiosk-restart-page",
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
              {isInterfaceEnabled("kiosk") && <Kiosk url={actionUrls?.kiosk} />}
            </Interface>
          )}
        </Form>
      )}

      <Modal
        className={cn("p-0 bg-ffffff/0")}
        close={previewModal.toggleOff}
        isShown={previewModal.isOn}
      >
        <Preview
          className="justify-self-center"
          app={currentAction.app}
          message={interfaceConfig.public_description ?? ""}
        />
      </Modal>
    </div>
  );
}
