import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";

export const LoginPage = () => (
  <div className="flex size-full items-center justify-center">
    <div className="grid max-w-[360px] gap-y-10">
      <LayersIconFrame>
        <WorldcoinBlueprintIcon />
      </LayersIconFrame>

      <div className="grid gap-y-3">
        <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
          World ID is now generally available
        </Typography>

        <Typography
          as="p"
          variant={TYPOGRAPHY.R3}
          className="text-center text-grey-500"
        >
          The Worldcoin Protocol will enable a new class of applications built
          on top of proof of personhood
        </Typography>
      </div>

      <div className="grid gap-y-4">
        <DecoratedButton href={urls.api.authLogin()} className="py-4">
          Create an account
        </DecoratedButton>

        <DecoratedButton
          variant="secondary"
          className="py-4"
          href="https://docs.worldcoin.org"
        >
          Explore Docs
        </DecoratedButton>
      </div>
    </div>
  </div>
);
