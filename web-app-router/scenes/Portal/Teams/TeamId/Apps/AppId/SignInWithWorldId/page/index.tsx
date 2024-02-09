import { DecoratedButton } from "@/components/DecoratedButton";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Image from "next/image";
import { ClientInformationPage } from "./ClientInformation";
import { DocsIcon } from "@/components/Icons/DocsIcon";

type SignInWithWorldIdPageProps = {
  params: Record<string, string> | null | undefined;
};
export const SignInWithWorldIdPage = async (
  props: SignInWithWorldIdPageProps,
) => {
  const { params } = props;
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as string;

  return (
    <div className="w-full h-full">
      <div className="grid md:grid-cols-auto/1fr/auto py-6 gap-x-7 grid-cols-1">
        <Image
          src="/passport.png"
          alt="passport"
          width={100}
          height={100}
          className="h-auto w-16"
        />
        <div className="grid grid-cols-1 items-center justify-items-start gap-y-0">
          <Typography variant={TYPOGRAPHY.H6}>Sign in with World ID</Typography>
          <Typography
            as="p"
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            Let users sign in to your app with their World ID using OpenID
            Connect (OIDC)
          </Typography>
        </div>
        <div className="grid grid-cols-1fr/auto gap-x-5 items-center">
          <DecoratedButton
            href="https://github.com/worldcoin/world-id-nextauth-template"
            variant="secondary"
            className="h-12 flex items-center justify-center"
          >
            <GithubIcon className="w-5 h-5" />
            <Typography
              as="p"
              variant={TYPOGRAPHY.M3}
              className="text-center text-grey-700"
            >
              See an example
            </Typography>
          </DecoratedButton>
          <DecoratedButton
            href="https://docs.worldcoin.org/id/sign-in"
            variant="secondary"
            className="h-12 flex items-center justify-center py-5"
          >
            <DocsIcon className="w-5 h-5" />
            <Typography
              as="p"
              variant={TYPOGRAPHY.M3}
              className="text-center text-grey-700"
            >
              Learn more
            </Typography>
          </DecoratedButton>
        </div>
      </div>
      <hr className="my-4 w-full text-grey-200 border-dashed" />
      <div className="grid grid-cols-2">
        <ClientInformationPage appID={appId} teamID={teamId} />
      </div>
    </div>
  );
};
