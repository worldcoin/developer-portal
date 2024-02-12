import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Form } from "./Form";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Suspense } from "react";

export const CreateTeamPage = () => {
  return (
    <SizingWrapper>
      <div className="flex justify-center items-center h-full">
        <div className="grid max-w-[580px] w-full gap-y-10">
          <LayersIconFrame>
            <WorldcoinBlueprintIcon />
          </LayersIconFrame>

          <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
            Create your first team
          </Typography>

          <Suspense>
            <Form />
          </Suspense>
        </div>
      </div>
    </SizingWrapper>
  );
};
