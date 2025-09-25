import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { GithubIcon } from "@/components/Icons/GithubIcon";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
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
            className="text-center text-grey-500 md:text-start"
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
            href="https://docs.world.org/world-id"
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

      <a
        href="https://docs.world.org/world-id/sign-in/deprecation"
        rel="noreferrer noopener"
        target="_blank"
        className="block w-full"
      >
        <div className="mb-8 mt-6 flex w-full items-center gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 px-6 py-4 shadow-sm transition-all hover:bg-orange-100 hover:shadow-md">
          <WarningErrorIcon className="h-full w-12 shrink-0 text-orange-600" />
          <div className="grow">
            <div className="text-base text-orange-800">
              <div className="font-medium">
                Sign in with World ID is sunsetting in{" "}
                <span className="font-bold">December 2025</span>.
              </div>
              <div className="mt-1 font-medium">
                New apps created after September 29, 2025 cannot enable this
                feature.
              </div>
              <div className="mt-2 font-semibold text-orange-900 underline">
                Read the full announcement →
              </div>
            </div>
          </div>
        </div>
      </a>

      <hr className="my-4 w-full border-dashed text-grey-200" />
      <div className="grid max-w-[580px] grid-cols-1">
        <ClientInformationPage appID={appId} teamID={teamId} />
      </div>
    </div>
  );
};
