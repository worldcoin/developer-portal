import { internal, ISuccessResult } from "@worldcoin/idkit";
import { Icon } from "common/Icon";
import { restAPIRequest } from "frontend-api";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useState } from "react";
import { ActionSelect } from "scenes/kiosk/common/ActionSelect";
import {
  ActionType,
  getActionStore,
  useActionStore,
} from "stores/action-store";
import { getKioskStore, Screen, useKioskStore } from "../../stores/kiosk-store";
import { KioskError } from "./common/KioskError";
import { Connected } from "./Connected";
import { Success } from "./Success";
import { Waiting } from "./Waiting";

type ProofResponse = {
  success: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string;
};

export const Kiosk = memo(function Kiosk(props: { appId: string }) {
  const router = useRouter();
  const { app_id, action } = router.query;

  // const { currentApp, fetchAppById } = useAppStore(getAppStore);
  const {
    actions,
    setActions,
    currentAction,
    setCurrentAction,
    fetchCustomActions,
  } = useActionStore(getActionStore);
  const { kioskApp, screen, setScreen, fetchPrecheck } =
    useKioskStore(getKioskStore);

  const { result, errorCode, verificationState, qrData, reset } =
    internal.useAppConnection(app_id, action);

  console.log("app_id:", app_id, "action:", action); // DEBUG

  const [response, setResponse] = useState<ProofResponse>();
  const [currentState, setCurrentState] = useState<typeof verificationState>();
  const [loading, setLoading] = useState(true);

  const handleClickBack = useCallback(() => {
    router.push("/"); // FIXME: define back url
  }, [router]);

  const handleActionChange = (action: ActionType) => {
    setCurrentAction(action);
    reset();
  };

  const verifyProof = useCallback(
    async (result: ISuccessResult) => {
      try {
        const response = await restAPIRequest<ProofResponse>(
          `/verify/${app_id}`,
          {
            method: "POST",
            json: { action, signal: "", ...result },
          }
        );

        return response;
      } catch (e) {
        console.warn("Error verifying proof. Please check network logs.");
        try {
          if ((e as Record<string, any>).code) {
            return {
              success: false,
              code: (e as Record<string, any>).code,
            };
          }
        } catch {}
        return { success: false, code: "unknown" };
      }
    },
    [app_id, action]
  );

  // Fetch application details via /precheck endpoint
  useEffect(() => {
    if (app_id && action) {
      console.log(app_id, action);
      fetchPrecheck(app_id as string, action as string);
    }
  }, [app_id, action, fetchPrecheck]);

  // Fetch the application by passed ID
  // useEffect(() => {
  //   if (props.appId && !currentApp) {
  //     fetchAppById(props.appId);
  //   }
  // }, [props.appId, currentApp, fetchAppById]);

  // Fetch all custom actions for the application
  // useEffect(() => {
  //   if (!actions.length) {
  //     fetchCustomActions(props.appId).then((response) => {
  //       if (response.data.action.length) {
  //         setActions(response.data.action);
  //         setCurrentAction(response.data.action[0]);
  //         setLoading(false);
  //       }
  //     });
  //   }
  // }, [actions, fetchCustomActions, props.appId, setActions, setCurrentAction]);

  // Update the current actions after they are fetched
  // useEffect(() => {
  //   if (!currentAction) {
  //     setCurrentAction(actions[0]);
  //   }
  // }, [actions, currentAction, setCurrentAction]);

  // Change the shown screen based on /verify response
  useEffect(() => {
    if (!result) return;

    verifyProof(result).then((response: ProofResponse) => {
      setResponse(response);
      if (response?.success) {
        setScreen(Screen.Success);
      } else if (response?.code === "already_verified") {
        setScreen(Screen.AlreadyVerified);
      } else if (response?.code === "invalid_merkle_root") {
        setScreen(Screen.InvalidIdentity);
      } else {
        setScreen(Screen.VerificationError);
      }
    });
  }, [result, setScreen, verifyProof]);

  // Change the shown screen based on current verificationState and errorCode
  useEffect(() => {
    if (verificationState && currentState !== verificationState) {
      switch (verificationState) {
        case "loading_widget":
        case "awaiting_connection":
          setScreen(Screen.Waiting);
          break;
        case "awaiting_verification":
          setScreen(Screen.Connected);
          break;
        case "confirmed":
          setScreen(Screen.Success);
          break;
        case "failed":
          switch (errorCode) {
            case "connection_failed":
              setScreen(Screen.ConnectionError);
              break;
            case "already_signed":
              setScreen(Screen.AlreadyVerified);
              break;
            case "verification_rejected":
              setScreen(Screen.VerificationRejected);
              break;
            case "unexpected_response":
            case "generic_error":
          }
          setScreen(Screen.VerificationError);
      }
      setCurrentState(verificationState);
    }
  }, [verificationState, currentState, setScreen, errorCode]);

  return (
    <div className="flex flex-col h-screen">
      <header className="relative shrink-0 flex items-center justify-center h-[86px]">
        <div className="absolute top-0 bottom-0 left-0 flex items-center pl-4">
          <button
            className="flex items-center justify-center w-9 h-9 bg-ebecef rounded-full"
            onClick={handleClickBack}
          >
            <Icon name="arrow-left" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center">
          <Icon name="logo" className="w-[142px] h-6" />
        </div>

        <div className="absolute top-0 bottom-0 right-0 flex items-center gap-x-4 pr-6">
          <div className="font-rubik font-medium text-14">
            {kioskApp?.name ?? "Loading..."}
          </div>
          <Icon path={kioskApp?.logo_url} className="w-11 h-11 rounded-full" />
        </div>
      </header>

      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center portrait:py-12 landscape:py-4">
        <div className="flex flex-col items-center">
          <h1 className="font-sora font-semibold text-32 leading-10">
            World ID Kiosk Verification
          </h1>

          <div className="max-w-[400px] portrait:mt-12 landscape:mt-6 grid grid-cols-auto/1fr items-center gap-x-3 p-4 bg-primary rounded-2xl">
            <div className="font-rubik text-16 text-ffffff leading-5">
              {currentAction?.description ?? "Loading..."}
            </div>
          </div>
        </div>
        {screen === Screen.Waiting && (
          <Waiting appId={app_id} qrData={qrData} />
        )}
        {screen === Screen.Connected && <Connected reset={reset} />}
        {screen === Screen.Success && (
          <Success
            createdAt={response?.created_at}
            confirmationId={response?.nullifier_hash
              ?.slice(-8)
              .toLocaleUpperCase()}
          />
        )}

        {screen === Screen.ConnectionError && (
          <KioskError
            title="Connection Error"
            description="We cannot establish a connection to the Worldcoin app. Please refresh and try again."
            buttonText="Retry"
          />
        )}

        {screen === Screen.AlreadyVerified && (
          <KioskError
            title="Already verified"
            description="This person has already verified for this action."
            buttonText="New verification for another user"
          />
        )}

        {screen === Screen.VerificationRejected && (
          <KioskError
            title="Verification rejected"
            description="Verification rejected in the Worldcoin app."
            buttonText="Try again"
          />
        )}

        {screen === Screen.InvalidIdentity && (
          <KioskError
            title="User is not verified"
            description="Looks like this user is not verified with World ID. They can visit an orb to verify."
            buttonText="New verification for another user"
          />
        )}

        {screen === Screen.VerificationError && (
          <KioskError
            title="Verification Error"
            description="We couldn't verify this user. Please try again."
            buttonText="Retry"
          />
        )}

        {actions.length > 0 && currentAction && (
          <div className="flex flex-col items-center gap-y-2">
            <div className="font-rubik font-medium text-16 leading-5">
              Choose Action
            </div>

            <ActionSelect
              value={currentAction}
              onChange={handleActionChange}
              options={actions}
            />
          </div>
        )}
      </div>
    </div>
  );
});
