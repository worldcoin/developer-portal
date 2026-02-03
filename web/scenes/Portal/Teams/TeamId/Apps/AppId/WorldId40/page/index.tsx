import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const WorldId40Page = () => {
  return (
    <SizingWrapper className="flex flex-col gap-y-8 py-10">
      <Typography variant={TYPOGRAPHY.H6}>World ID 4.0</Typography>
      <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
        Management page coming soon.
      </Typography>
    </SizingWrapper>
  );
};
