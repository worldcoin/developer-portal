"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { LegalIcon } from "@/components/Icons/LegalIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { acceptTermsText } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/NotVerified/AcceptTerms/doc";

type Props = {
  loading: boolean;
  onConfirm: () => void;
};

export const AcceptTerms = (props: Props) => {
  return (
    <div className="grid w-[480px] grid-cols-1 justify-items-center pt-12">
      <CircleIconContainer variant="info">
        <LegalIcon className="size-7 text-blue-500" />
      </CircleIconContainer>

      <div className="mt-6 grid justify-items-center gap-y-3">
        <Typography variant={TYPOGRAPHY.H6}>
          Confirm terms and conditions
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R3}
          className="text-center text-grey-500"
        >
          In order to register for the Affiliate program, confirm that you agree
          with the Terms and conditions
        </Typography>
      </div>

      <Typography
        as="p"
        variant={TYPOGRAPHY.R5}
        className="mt-8 h-[300px] w-full overflow-auto whitespace-pre-wrap rounded-2xl bg-grey-50 p-4 text-grey-500"
      >
        {acceptTermsText}
      </Typography>

      <DecoratedButton
        type="button"
        onClick={props.onConfirm}
        disabled={props.loading}
        className="mt-10 w-full"
      >
        I agree
      </DecoratedButton>
    </div>
  );
};
