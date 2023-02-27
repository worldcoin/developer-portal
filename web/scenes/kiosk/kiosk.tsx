import { Icon } from "common/Icon";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useState } from "react";
import { ActionSelect } from "scenes/kiosk/common/ActionSelect";
import { KioskError } from "./common/KioskError";
import { Connected } from "./Connected";
import { getKioskStore, Screen, useKioskStore } from "./store/kiosk-store";
import { Success } from "./Success";
import { Waiting } from "./Waiting";

export const Kiosk = memo(function Kiosk() {
  const router = useRouter();
  const { actions, selectedAction, setSelectedAction, screen, setScreen } =
    useKioskStore(getKioskStore);

  const handleClickBack = useCallback(() => {
    router.push("/"); // FIXME: define back url
  }, [router]);

  useEffect(() => {
    setSelectedAction(actions[0]);
  }, [actions, setSelectedAction]);

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
          <div className="font-rubik font-medium text-14">App Name</div>
          <div className="w-11 h-11 rounded-full bg-edecfc" />
        </div>
      </header>

      <div className="grow grid grid-rows-auto/1fr/auto items-center justify-center portrait:py-12 landscape:py-4">
        <div className="flex flex-col items-center">
          <h1 className="font-sora font-semibold text-32 leading-10">
            World ID Kiosk Verification
          </h1>

          <div className="max-w-[400px] portrait:mt-12 landscape:mt-6 grid grid-cols-auto/1fr items-center gap-x-3 p-4 bg-primary rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-edecfc" />

            <div className="font-rubik text-16 text-ffffff leading-5">
              Attending the ETH NY conference as a participant on June 2022.
            </div>
          </div>
        </div>

        {screen === Screen.Waiting && <Waiting />}
        {screen === Screen.Connected && <Connected />}
        {screen === Screen.Success && <Success />}

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

        {actions.length > 0 && selectedAction && (
          <div className="flex flex-col items-center gap-y-2">
            <div className="font-rubik font-medium text-16 leading-5">
              Choose Action
            </div>

            <ActionSelect
              value={selectedAction}
              onChange={setSelectedAction}
              options={actions}
            />
          </div>
        )}
      </div>
    </div>
  );
});
