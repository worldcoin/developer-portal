import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Image from "next/image";
import { ClientInformationPage } from "./ClientInformation";
import { getSdk as GetSignInSDK } from "./graphql/server/fetch-signin.generated";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";

type SignInWithWorldIdPageProps = {
  params: Record<string, string> | null | undefined;
};
export const SignInWithWorldIdPage = async (
  props: SignInWithWorldIdPageProps
) => {
  const { params } = props;
  const appId = params?.appId as `app_${string}`;
  const client = await getAPIServiceGraphqlClient();
  const data = await GetSignInSDK(client).SignInAction({
    app_id: appId,
  });
  const signInAction = data?.action;
  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-auto/1fr/auto pt-6 gap-x-5">
        <Image src="/passport.png" alt="passport" width={60} height={60} />
        <div className="grid grid-cols-1 items-center justify-items-start gap-y-0">
          <Typography as="h3" variant={TYPOGRAPHY.H6}>
            Sign in with World ID
          </Typography>
          <Typography
            as="p"
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Let users sign in to your app with their World ID using OpenID
            Connect (OIDC)
          </Typography>
        </div>
        <div className="grid grid-cols-2 gap-x-3 items-center">
          <DecoratedButton
            href="https://github.com/worldcoin/world-id-nextauth-template"
            variant="secondary"
            className="h-12 flex items-center justify-center"
          >
            <GithubIcon className="w-5 h-5" />
            <Typography
              as="p"
              variant={TYPOGRAPHY.R2}
              className="text-center text-grey-700"
            >
              Open in GitHub
            </Typography>
          </DecoratedButton>
          <DecoratedButton
            href="https://docs.worldcoin.org/id/sign-in"
            variant="secondary"
            className="h-12 flex items-center justify-center py-5"
          >
            {/* // TODO: Replace Icon in after rebase */}
            <WorldcoinIcon className="w-5 h-5" />
            <Typography
              as="p"
              variant={TYPOGRAPHY.R2}
              className="text-center text-grey-700"
            >
              Learn more
            </Typography>
          </DecoratedButton>
        </div>
      </div>
      <hr className="my-5 w-full text-grey-200 border-dashed" />
      <div className="grid grid-cols-2">
        <ClientInformationPage appID={appId} action={signInAction} />
      </div>
    </div>
  );
};
