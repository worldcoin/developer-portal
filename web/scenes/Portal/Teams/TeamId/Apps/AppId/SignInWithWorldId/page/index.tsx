import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Image from "next/image";
import { ClientInformationPage } from "./ClientInformation";

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
    <div className="size-full py-5">
      <div className="grid grid-cols-1 items-center justify-center justify-items-center gap-x-7 gap-y-6 rounded-3xl border p-8 md:grid-cols-auto/1fr/auto md:justify-items-start md:border-none md:px-0">
        <Image
          src="/passport.png"
          alt="passport"
          width={100}
          height={100}
          className="h-auto w-16"
        />
        <div className="grid h-fit items-center justify-items-center gap-y-2 md:justify-items-start">
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
        <div className="grid grid-cols-1fr/auto items-center gap-x-5">
          <DecoratedButton
            href="https://github.com/worldcoin/world-id-nextauth-template"
            variant="secondary"
            className="flex h-12 items-center justify-center"
          >
            <GithubIcon className="size-5" />
            <Typography
              as="p"
              variant={TYPOGRAPHY.M3}
              className="hidden text-center text-grey-700 md:block"
            >
              See an example
            </Typography>
          </DecoratedButton>
          <DecoratedButton
            href="https://docs.worldcoin.org/id/sign-in"
            variant="secondary"
            className="flex h-12 items-center justify-center py-5"
          >
            <DocsIcon className="hidden size-5 md:block" />
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
      <hr className="my-4 w-full border-dashed text-grey-200" />
      <div className="grid max-w-[580px] grid-cols-1">
        <ClientInformationPage appID={appId} teamID={teamId} />
      </div>
    </div>
  );
};
