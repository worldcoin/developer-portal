import { Icon } from "common/Icon";
import { Button } from "common/Button";
import { Widget } from "common/Widget";
import { Fragment, memo, useState } from "react";
import { Overview } from "scenes/action/common/Overview";
import { Progress } from "scenes/action/common/Progress";
import { ProgressStep } from "scenes/action/types/progress-step";
import { JSWidgetInstructions } from "scenes/action/common/JSWidgetInstructions";

import { actionLogic } from "logics/actionLogic";
import { APIInstructions } from "./Instructions";

export const CloudWidget = memo(function CloudWidget(props: {
  actionId: string;
  steps: ProgressStep[];
  enableUserInterface: typeof actionLogic.actions.enableUserInterface;
  isUserInterfaceEnabled?: boolean;
}) {
  const [step, _setStep] = useState<ProgressStep>(props.steps[0]);

  return (
    <Fragment>
      {!!props.steps.filter(({ finished }) => !finished).length && (
        <>
          <Widget title="Deployment progress" className="mt-4">
            <Progress steps={props.steps} currentStep={step} />
          </Widget>
          <button
            className="text-primary grid grid-flow-col justify-center"
            onClick={() => props.enableUserInterface("widget")}
          >
            <span className="font-medium">
              Skip integration instructions. Go Live!
            </span>
            <Icon name="angle-down" className="w-6 h-6 -rotate-90" />
          </button>
        </>
      )}

      <Widget
        expandable
        opened={!props.isUserInterfaceEnabled}
        title="Overview"
        description="API & JS widget"
      >
        <Overview
          items={[
            { icon: "overview-js", text: "Your app shows the JS widget" },

            {
              icon: "overview-qr",
              text: (
                <span>
                  User verifies with World ID on{" "}
                  <span className="font-semibold">your</span> site
                </span>
              ),
            },

            {
              icon: "overview-proof",
              text: "Your backend sends the proof to our API",
            },

            {
              icon: "overview-backend",
              text: "Our API verifies the proof and your backend executes action",
            },
          ]}
        />
      </Widget>

      <Widget
        expandable
        opened={!props.isUserInterfaceEnabled}
        title="Deployment instructions"
      >
        <div className="grid gap-y-6">
          <JSWidgetInstructions action_id={props.actionId} />

          <div className="grid grid-cols-auto/1fr items-center gap-x-5">
            <Icon name="checkmark-selected" className="w-6 h-6 text-primary" />
            <span className="font-semibold">Verify the proof with the API</span>
          </div>

          <APIInstructions actionId={props.actionId} />

          <Button
            id="saveActionUserInterface"
            className="justify-self-end"
            variant="contained"
            color="primary"
            fullWidth
            maxWidth="xs"
            // FIXME: Once we have automated API testing, this shouldn't enable user interface directly
            onClick={() => props.enableUserInterface("widget")}
          >
            I&apos;ve done this
          </Button>
        </div>
      </Widget>

      {/* FIXME: Implement integration testing */}
      {/* <Widget expandable opened title="Test your integration" opened={!props.isUserInterfaceEnabled}>
        <div className="grid gap-y-12">
          <div className="grid gap-y-2">
            <p className="font-semibold leading-tight">
              Run a test verification to test your integration. We’ll verify
              everything looks good.
            </p>
            <p className="text-14 text-neutral leading-tight">
              We will only use this to test your integration. It will not be
              counted or stored.
            </p>
          </div>

          <Instructions
            items={[
              {
                step: "Launch your app and open the World ID verification widget.",
                children: (
                  <p className={cn(text.caption, "mb-12")}>
                    <span>
                      You can use any signal value, but be sure to set your
                      action ID{" "}
                    </span>
                    <span className="font-semibold">{props.actionId}.</span>
                  </p>
                ),
              },
              {
                step: "Open the simulator",
                children: (
                  <div className={cn("grid gap-y-6", text.caption, "mb-12")}>
                    <p>
                      This action is in the{" "}
                      <span className="font-semibold">staging</span>{" "}
                      environment. Use the simulator to generate a test identity
                      and scan the World ID QR code.
                    </p>

                    <Button
                      className="max-w-xs"
                      variant="contained"
                      color="primary"
                      fullWidth
                    >
                      Go to simulator
                    </Button>
                  </div>
                ),
              },
              {
                step: "Send the proof to our API",
                children: (
                  <p className={cn(text.caption, "mb-12")}>
                    You should do the exact request you would do with a live
                    integration (see{" "}
                    <a
                      className="text-primary hover:opacity-70 transition-opacity"
                      href="#"
                    >
                      Deployment instructions
                    </a>{" "}
                    for details).
                  </p>
                ),
              },
              {
                step: "We’ll verify your API request",
                children: (
                  <span className={cn(text.caption, "mb-12")}>
                    This page will refresh automatically with the verification
                    results.
                  </span>
                ),
              },
            ]}
          />

          <div>
            {loading && (
              <CodeBlock code="" loading language="bash" theme="neutral" />
            )}

            {!loading && (
              <div className="grid gap-y-6">
                <CodeBlock
                  code={
                    success
                      ? '{\n"merkleProof": "valid"\n}'
                      : '{\n"merkleProof": "invalid"\n}'
                  }
                  language="json"
                  theme={success ? "success" : "error"}
                  caption="Request"
                  captionClassName={captionStyle}
                />

                <CodeBlock
                  code={
                    success
                      ? '{\n"success": true\n}'
                      : '{\n"attr": "merkleProof",\n"code": "invalid",\n"detail": "This attribute is not valid."\n}'
                  }
                  language="json"
                  theme={success ? "success" : "error"}
                  caption={success ? "Response (200)" : "Response (400)"}
                  captionClassName={captionStyle}
                />
              </div>
            )}
          </div>
        </div>
      </Widget> */}
    </Fragment>
  );
});
