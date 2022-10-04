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

export function Deployment() {
  const [currentTab, setCurrentTab] = useState<UserInterfacesType>("widget");
  const {
    currentAction,
    currentActionLoading,
    actionUrls,
    deploymentSteps,
    apiWidgetSteps,
  } = useValues(actionLogic);
  const { enableUserInterface, disableUserInterface } = useActions(actionLogic);

  // Set first enabled interface or first in list
  useEffect(() => {
    setCurrentTab(
      userInterfaces.reduce<UserInterfacesType | null>((result, current) => {
        return result ||
          !currentAction?.user_interfaces.enabled_interfaces?.includes(current)
          ? result
          : current;
      }, null) || userInterfaces[0]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAction?.id]);

  const [publicDescription, setPublicDescription] = useState("");

  useEffect(
    () => setPublicDescription(currentAction?.public_description ?? ""),
    [currentAction?.public_description]
  );

  const isWidgetInterfaceEnabled = useMemo(() => {
    return currentAction?.user_interfaces.enabled_interfaces?.includes(
      "widget"
    );
  }, [currentAction]);

  const isHostedInterfaceEnabled = useMemo(() => {
    return currentAction?.user_interfaces.enabled_interfaces?.includes(
      "hosted_page"
    );
  }, [currentAction]);

  const isKioskInterfaceEnabled = useMemo(() => {
    return currentAction?.user_interfaces.enabled_interfaces?.includes("kiosk");
  }, [currentAction]);

  const handleChangeInterfaceEnabled = useCallback(
    (id: UserInterfacesType) => (enabled: boolean) => {
      if (!enabled) {
        disableUserInterface(id);
      } else {
        enableUserInterface(id);
      }
    },
    [enableUserInterface, disableUserInterface]
  );

  if (!currentAction) {
    return null;
  }

  return (
    <div>
      <h2 className="mt-6 mb-3 font-sora font-semibold text-16 leading-5">
        General
      </h2>

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
            >
              Preview Worldcoin App
            </Button>
          </div>
          <FieldInput
            id={`${Deployment.name}-publicDescription`}
            className="!h-[44px] !px-4"
            variant="small"
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
            disabled={currentActionLoading}
          />
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
          icon="api"
          name="API & JS widget"
          description="Add the JS widget to your website and verify proofs with our API."
          enabled={isWidgetInterfaceEnabled}
          onChangeEnabled={handleChangeInterfaceEnabled("widget")}
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
          icon="api"
          name="Smart contract & JS widget"
          description="Add the JS widget to your website and verify proofs with our API."
          enabled={isWidgetInterfaceEnabled}
          onChangeEnabled={handleChangeInterfaceEnabled("widget")}
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
          {isWidgetInterfaceEnabled && <OnChainWidget />}
        </Interface>
      )}

      <Interface
        icon="window"
        name="Hosted page"
        description="Redirect the user to our page for verification, we’ll redirect the user back upon success."
        enabled={isHostedInterfaceEnabled}
        onChangeEnabled={handleChangeInterfaceEnabled("hosted_page")}
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
        {isHostedInterfaceEnabled && <HostedPage actionId={currentAction.id} />}
      </Interface>

      {currentAction.engine === "cloud" && (
        <Interface
          icon="kiosk"
          name="Kiosk"
          description="Verify users in-person right here. No code needed."
          enabled={isKioskInterfaceEnabled}
          onChangeEnabled={handleChangeInterfaceEnabled("kiosk")}
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
          {isKioskInterfaceEnabled && (
            <KioskAccess
              deploymentStep={deploymentSteps?.kiosk}
              url={actionUrls?.kiosk}
            />
          )}
        </Interface>
      )}
    </div>
  );
}
