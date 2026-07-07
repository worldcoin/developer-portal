"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useAutoRegisterRp } from "@/scenes/PortalV3/layout/CreateAppDialog/use-auto-register-rp";
import { useGetActionsV4Query } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/page/graphql/client/get-actions-v4.generated";
import { useRouter } from "next/navigation";

interface SetupStripProps {
  appId: string;
  teamId: string;
  hasRpRegistration: boolean;
  canRegisterRp: boolean;
}

// Dashboard strip mounted above VerificationStatusSection. Guides the app to
// the point where it can verify: RP recovery, then a first-action CTA, then
// nothing. The first-verification "waiting → received" moment deliberately
// lives on the action page (next to the integration snippet), not here.
export const SetupStrip = ({
  appId,
  teamId,
  hasRpRegistration,
  canRegisterRp,
}: SetupStripProps) => {
  const router = useRouter();
  const {
    status: registerStatus,
    signerKey,
    error: registerError,
    run: runRegistration,
    reset: resetRegistration,
  } = useAutoRegisterRp();

  // Whether the app has any actions yet decides between the first-action CTA
  // and rendering nothing. Skipped until the RP is registered so a broken RP
  // setup doesn't also query actions. Actions are created on OTHER pages, so
  // revalidate on mount rather than trusting a stale cached "zero actions".
  const { data } = useGetActionsV4Query({
    variables: { app_id: appId },
    skip: !hasRpRegistration,
    fetchPolicy: "cache-and-network",
  });

  const hasActions = (data?.action_v4 ?? []).length > 0;

  const handleRetry = () => runRegistration(appId);

  const handleKeySaved = () => {
    resetRegistration();
    router.refresh();
  };

  if (!hasRpRegistration) {
    return (
      <div className="grid gap-y-4 rounded-xl border border-grey-200 bg-grey-50 p-6">
        {registerStatus === "key-ready" && signerKey ? (
          <div className="grid gap-y-6">
            <div className="grid gap-y-1">
              <Typography variant={TYPOGRAPHY.M4}>
                Save your signing key
              </Typography>
              <Typography
                as="p"
                variant={TYPOGRAPHY.R4}
                className="text-grey-500"
              >
                Your app is registered for World ID. This private key signs
                operations for your app — save it securely before continuing.
              </Typography>
            </div>

            <div className="flex items-center justify-between gap-x-2 rounded-lg border border-grey-200 bg-white p-4">
              <p
                className="break-all font-mono text-sm text-grey-900"
                data-testid="strip-private-key-value"
              >
                {signerKey.privateKey}
              </p>
              <CopyButton
                fieldName="Private key"
                fieldValue={signerKey.privateKey}
              />
            </div>

            <Typography
              as="button"
              type="button"
              onClick={() => downloadKeyFile(signerKey)}
              variant={TYPOGRAPHY.R4}
              className="justify-self-start text-left text-blue-600 underline hover:opacity-70"
            >
              Download Key File (.json)
            </Typography>

            <Notification variant="warning">
              <Typography
                as="p"
                variant={TYPOGRAPHY.S4}
                className="max-w-[65ch] text-system-warning-800"
              >
                This key will not be shown again — save it now. Never share it
                or commit it to version control.
              </Typography>
            </Notification>

            <DecoratedButton
              type="button"
              variant="primary"
              className="justify-self-end py-3"
              onClick={handleKeySaved}
            >
              I saved my key
            </DecoratedButton>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid gap-y-1">
              <Typography variant={TYPOGRAPHY.M4}>
                {
                  "Finishing setup — your app isn't registered for World ID yet."
                }
              </Typography>
              {registerStatus === "failed" && registerError && (
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.R4}
                  className="text-system-warning-800"
                >
                  {registerError}
                </Typography>
              )}
              {!canRegisterRp && (
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.R4}
                  className="text-grey-500"
                >
                  A team owner or admin needs to finish World ID setup.
                </Typography>
              )}
            </div>

            {canRegisterRp && (
              <DecoratedButton
                type="button"
                variant="primary"
                className="py-3"
                onClick={handleRetry}
                disabled={registerStatus === "registering"}
              >
                {registerStatus === "registering" ? (
                  <span className="flex items-center gap-x-2">
                    <SpinnerIcon className="size-4 animate-spin" />
                    Retry registration
                  </span>
                ) : registerStatus === "failed" ? (
                  "Retry again"
                ) : (
                  "Retry registration"
                )}
              </DecoratedButton>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!hasActions) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-grey-200 bg-grey-50 p-6">
        <Typography variant={TYPOGRAPHY.M4}>
          Create your first action to start verifying users with World ID.
        </Typography>
        <DecoratedButton
          href={urls.worldIdActions({ team_id: teamId, app_id: appId })}
          variant="primary"
          className="py-3"
        >
          Create your first action
        </DecoratedButton>
      </div>
    );
  }

  return null;
};

const downloadKeyFile = (signerKey: {
  address: string;
  privateKey: string;
}) => {
  const keyData = {
    privateKey: signerKey.privateKey,
    publicKey: signerKey.address,
    warning:
      "IMPORTANT: Keep this private key secure. Never share it or commit it to version control.",
  };

  const jsonString = JSON.stringify(keyData, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(jsonString);
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = `signing-key-${signerKey.address.slice(0, 8)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
