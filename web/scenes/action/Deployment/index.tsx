import { useActions, useValues } from "kea";
import { actionLogic } from "logics/actionLogic";
import { useEffect, useState } from "react";
import { userInterfaces, UserInterfacesType } from "types";
import { CloudWidget } from "./CloudWidget";
import { HostedPage } from "./HostedPage";
import { Kiosk } from "./Kiosk";
import { OnChainWidget } from "./OnChainWidget";
import { UserInterfaces } from "./UserInterfaces";

export function Deployment() {
  const [currentTab, setCurrentTab] = useState<UserInterfacesType>("widget");
  const { currentAction, actionUrls, deploymentSteps, apiWidgetSteps } =
    useValues(actionLogic);
  const { enableUserInterface } = useActions(actionLogic);

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

  if (!currentAction) {
    return null;
  }

  return (
    <div>
      {currentAction.engine === "cloud" ? (
        <UserInterfaces
          currentTab={currentTab}
          enabledInterfaces={currentAction.user_interfaces.enabled_interfaces}
          onChangeTab={setCurrentTab}
          tabs={[
            {
              key: "widget",
              icon: "api",
              title: "API & JS widget",
              description: `Add the JS widget to your website and verify proofs with our API.`,
              content: (
                <CloudWidget
                  actionId={currentAction.id}
                  steps={apiWidgetSteps}
                  enableUserInterface={enableUserInterface}
                  isUserInterfaceEnabled={currentAction.user_interfaces.enabled_interfaces?.includes(
                    "widget"
                  )}
                />
              ),
            },
            {
              key: "hosted_page",
              icon: "window",
              title: "Hosted page",
              description: `Redirect the user to our page for verification.`,
              content: <HostedPage actionId={currentAction.id} />,
            },
            {
              key: "kiosk",
              icon: "kiosk",
              title: "Kiosk",
              description: `Verify users in-person right here. No code needed.`,
              content: (
                <Kiosk
                  deploymentStep={deploymentSteps?.kiosk}
                  enableUserInterface={enableUserInterface}
                  url={actionUrls?.kiosk}
                />
              ),
            },
          ]}
        />
      ) : (
        <UserInterfaces
          currentTab={currentTab}
          enabledInterfaces={currentAction.user_interfaces.enabled_interfaces}
          onChangeTab={setCurrentTab}
          tabs={[
            {
              key: "widget",
              icon: "api",
              title: "Smart contract & JS widget",
              description: `Add the JS widget to your website and verify proofs with our API.`,
              content: <OnChainWidget />,
            },
            {
              key: "hosted_page",
              icon: "window",
              title: "Hosted page",
              description: `Redirect the user to our page for verification.`,
              content: <HostedPage actionId={currentAction.id} />,
            },
            {
              key: "kiosk",
              icon: "kiosk",
              title: "Kiosk",
              description: `Verify users in-person right here. No code needed.`,
              disabled: true,
            },
          ]}
        />
      )}
    </div>
  );
}
