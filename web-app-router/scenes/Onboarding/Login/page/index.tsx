import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";

export const LoginPage = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="grid gap-y-10 max-w-[360px]">
      <div className="justify-self-center relative w-[120px] h-[120px] flex justify-center items-center">
        <div className="absolute inset-0 border opacity-[0.16] border-[#D9E1F6] rounded-[24px] p-2.5 shadow-[0px_4px_8px_0px_#D9E1F6]" />
        <div className="absolute inset-2.5 border border-[#D9E1F6] opacity-[0.16] rounded-20 p-2.5 shadow-[0px_4px_8px_0px_#D9E1F6]" />
        <WorldcoinBlueprintIcon />
      </div>

      <div className="grid gap-y-3">
        <h1 className="text-2xl text-center font-medium font-twk">
          World ID is now generally available
        </h1>

        <p className="font-gta text-grey-400">
          The Worldcoin Protocol will enable a new class of applications built
          on top of prof of personhood
        </p>
      </div>

      <div className="grid gap-y-4">
        <DecoratedButton href="#" className="py-3">
          Create an account
        </DecoratedButton>

        <DecoratedButton
          variant="secondary"
          className="py-3"
          href="https://docs.worldcoin.org"
        >
          Explore Docs
        </DecoratedButton>
      </div>
    </div>
  </div>
);
