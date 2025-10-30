"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { QuickAction } from "@/components/QuickAction";
import { useAtom } from "jotai/index";
import { WalletDialog, walletDialogAtom } from "./WalletDialog";
import { EmailDialog, emailDialogAtom } from "./EmailDialog";
import { useGetAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/hooks/use-get-affiliate-balance";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { GmailIcon } from "@/components/Icons/GmailIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { formatWalletAddress } from "@/lib/utils";
import Skeleton from "react-loading-skeleton";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const AffiliateAccountPage = (props: PageProps) => {
  const { user, isLoading: isEmailLoading } = useUser() as Auth0SessionUser;
  const { data: balance, loading: isWalletLoading } = useGetAffiliateBalance();

  const [, setIsWalletDialogOpened] = useAtom(walletDialogAtom);
  const [, setIsEmailDialogOpened] = useAtom(emailDialogAtom);

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow mt-6 md:mt-10"
        className="flex flex-col"
      >
        <EmailDialog email={user?.email || ""} />
        <WalletDialog walletAddress={balance?.withdrawalWallet || ""} />
        <div className="grid gap-y-8">
          <Typography variant={TYPOGRAPHY.H6}>Account</Typography>

          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            {isEmailLoading || isWalletLoading ? (
              <>
                <Skeleton height={98} className="rounded-2xl" />
                <Skeleton height={98} className="rounded-2xl" />
              </>
            ) : (
              <>
                <QuickAction
                  type="button"
                  icon={<GmailIcon className="size-5.5" />}
                  title="Email address"
                  description={user?.email || ""}
                  onClick={() => setIsEmailDialogOpened(true)}
                />

                <QuickAction
                  type="button"
                  icon={<WalletIcon className="size-5.5" />}
                  title="Wallet address"
                  description={formatWalletAddress(
                    balance?.withdrawalWallet || "",
                  )}
                  onClick={() => setIsWalletDialogOpened(true)}
                />
              </>
            )}
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
