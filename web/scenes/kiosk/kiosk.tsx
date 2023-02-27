import { useActions, useValues } from "kea";
import { authLogic } from "logics/authLogic";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { urls } from "urls";
import { KioskError } from "./common/KioskError";
import { Connected } from "./Connected";
import { Intro } from "./Intro";
import { kioskLogic } from "./kioskLogic";
import { Layout } from "./Layout";
import { Success } from "./Success";
import { Waiting } from "./Waiting";

export function Kiosk() {
  const router = useRouter();
  useEffect(() => {
    kioskLogic({
      action_id: router.query.action_id?.toString(),
    });
  }, [router.query]);
  const { action, screen, verifiedProof } = useValues(kioskLogic);
  const { setScreen, verifyProof } = useActions(kioskLogic);
  const { isAuthenticated } = useValues(authLogic);

  const backUrl = useMemo(() => {
    if (!isAuthenticated || !action) return undefined;
    return urls.actions("custom");
  }, [action, isAuthenticated]);

  return (
    <Layout
      actionId={kioskLogic.props.action_id}
      app={action?.app}
      description={action?.public_description}
      title="World ID Kiosk Verification"
      backUrl={backUrl}
    >
      {!screen ||
        (screen === "intro" && (
          <Intro actionId={kioskLogic.props.action_id} setScreen={setScreen} />
        ))}

      {screen === "waiting" && action !== null && (
        <Waiting
          setScreen={setScreen}
          verifyProof={verifyProof}
          action={action}
          signal="kioskVerification"
        />
      )}

      {screen === "connected" && <Connected setScreen={setScreen} />}
      {screen === "success" && (
        <Success
          setScreen={setScreen}
          confirmationId={verifiedProof?.nullifier_hash?.substring(
            verifiedProof?.nullifier_hash?.length - 8,
            verifiedProof?.nullifier_hash.length
          )}
          createdAt={verifiedProof?.created_at}
        />
      )}

      {screen === "connectionError" && (
        <KioskError
          setScreen={setScreen}
          title="Connection Error"
          description="We cannot establish a connection to the Worldcoin app. Please refresh and try again."
          buttonText="Retry"
        />
      )}

      {screen === "alreadyVerified" && (
        <KioskError
          setScreen={setScreen}
          title="Already verified"
          description="This person has already verified for this action."
          buttonText="New verification for another user"
        />
      )}

      {screen === "verificationRejected" && (
        <KioskError
          setScreen={setScreen}
          title="Verification rejected"
          description="Verification rejected in the Worldcoin app."
          buttonText="Try again"
        />
      )}

      {screen === "invalidIdentity" && (
        <KioskError
          setScreen={setScreen}
          title="User is not verified"
          description="Looks like this user is not verified with World ID. They can visit an orb to verify."
          buttonText="New verification for another user"
        />
      )}

      {screen === "verificationError" && (
        <KioskError
          setScreen={setScreen}
          title="Verification Error"
          description="We couldn't verify this user. Please try again."
          buttonText="Retry"
        />
      )}
    </Layout>
  );
}
