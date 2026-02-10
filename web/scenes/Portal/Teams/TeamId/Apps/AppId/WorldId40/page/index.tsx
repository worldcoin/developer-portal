import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getSdk } from "./graphql/server/fetch-rp-registration.generated";
import { WorldId40Content } from "./WorldId40Content";

type Props = {
  params: {
    teamId: string;
    appId: string;
  };
};

export const WorldId40Page = async ({ params }: Props) => {
  const { appId } = params;

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration } = await getSdk(client).FetchRpRegistration({
    appId,
  });

  const rpData = rp_registration[0];

  if (!rpData) {
    return (
      <SizingWrapper className="flex flex-col gap-y-8 py-10">
        <Typography variant={TYPOGRAPHY.H3} className="text-grey-900">
          World ID 4.0
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          No RP registration found for this app.
        </Typography>
      </SizingWrapper>
    );
  }

  return (
    <WorldId40Content
      appId={appId}
      rpId={rpData.rp_id}
      initialStatus={
        rpData.status as "pending" | "registered" | "failed" | "deactivated"
      }
      mode={rpData.mode as string}
      signerAddress={rpData.signer_address ?? null}
      createdAt={rpData.created_at}
    />
  );
};
