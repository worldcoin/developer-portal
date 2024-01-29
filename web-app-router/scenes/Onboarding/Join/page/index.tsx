import { LayersIconFrame } from "@/components/LayersIconFrame";
import { Logo } from "./Logo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";
import Link from "next/link";

export const JoinPage = () => {
  const tempTeamData = {
    name: "A11.studio",
    logo: "https://worldcoin.org/icons/logo-small.svg",
  };

  return (
    <div className="w-full min-h-[100dvh] flex justify-center items-center">
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
            className="text-grey-500 text-center"
          >
            To join this team you need to create account on Worldcoin Developer
            Portal
          </Typography>
        </div>

        {/* FIXME: add href when auth0 PR will be merged */}
        <DecoratedButton href="#" className="mt-2">
          Join team
        </DecoratedButton>

        <p className="text-xs leading-[1.3] font-gta text-grey-500 text-center">
          By signing up, you are creating Developer Portal account and agree to
          Worldcoin`s{" "}
          <Link className="underline" href="#">
            User terms
          </Link>{" "}
          and{" "}
          <Link className="underline" href="#">
            Privacy notice
          </Link>
        </p>
      </div>
    </div>
  );
};
