import { DecoratedButton } from "@/components/DecoratedButton";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Link from "next/link";
import { Logo } from "./Logo";

export const JoinPage = () => {
  const tempTeamData = {
    name: "A11.studio",
    logo: "https://worldcoin.org/icons/logo-small.svg",
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center">
      <div className="grid max-w-[360px] gap-y-6">
        <LayersIconFrame>
          <Logo src={tempTeamData.logo} />
        </LayersIconFrame>

        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H6} className="text-center">
            Join {tempTeamData.name}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            To join this team you need to create account on Worldcoin Developer
            Portal
          </Typography>
        </div>

        {/* FIXME: add href when auth0 PR will be merged */}
        <DecoratedButton href="#" className="mt-2 py-3">
          Join team
        </DecoratedButton>

        <p className="text-center font-gta text-xs leading-[1.3] text-grey-500">
          By signing up, you are creating Developer Portal account and agree to
          Worldcoin`s{" "}
          <Link className="text-grey-900 underline" href="#">
            User terms
          </Link>{" "}
          and{" "}
          <Link className="text-grey-900 underline" href="#">
            Privacy notice
          </Link>
        </p>
      </div>
    </div>
  );
};
