import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const WorldIdActionsPage = () => {
  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-10">
      <Typography variant={TYPOGRAPHY.H6}>Actions</Typography>
      <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
        Actions page coming soon.
      </Typography>
    </SizingWrapper>
  );
};
