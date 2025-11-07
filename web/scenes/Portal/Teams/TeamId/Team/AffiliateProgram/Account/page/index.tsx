"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { QuickAction } from "@/components/QuickAction";
import { useAtom } from "jotai/index";
import { WalletDialog, walletDialogAtom } from "./WalletDialog";
import { EmailDialog, emailDialogAtom } from "./EmailDialog";
import { GmailIcon } from "@/components/Icons/GmailIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { formatWalletAddress } from "@/lib/utils";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const AffiliateAccountPage = (props: PageProps) => {
  const { data: metadata } = useGetAffiliateMetadata();

  const [, setIsWalletDialogOpened] = useAtom(walletDialogAtom);
  const [, setIsEmailDialogOpened] = useAtom(emailDialogAtom);

  return (
    <SizingWrapper
      gridClassName="order-2 grow mt-6 md:mt-10"
      className="flex flex-col"
    >
      <EmailDialog email={metadata?.email || ""} />
      <WalletDialog walletAddress={metadata?.withdrawalWallet || ""} />
      <div className="grid gap-y-8">
        <Typography variant={TYPOGRAPHY.H6}>Account</Typography>

        <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
          {metadata?.email && (
            <QuickAction
              type="button"
              icon={<GmailIcon className="size-5.5" />}
              title="Email address"
              description={metadata?.email || ""}
              onClick={() => setIsEmailDialogOpened(true)}
            />
          )}

          {metadata?.withdrawalWallet && (
            <QuickAction
              type="button"
              icon={<WalletIcon className="size-5.5" />}
              title="Wallet address"
              description={formatWalletAddress(
                metadata?.withdrawalWallet || "",
              )}
              onClick={() => setIsWalletDialogOpened(true)}
            />
          )}
        </div>
      </div>
    </SizingWrapper>
  );
};
