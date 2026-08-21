import { WorldBlueprintIcon } from "@/components/Icons/WorldBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

export const InviteCard = (props: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="flex min-h-dvh w-full items-center justify-center">
    <div className="grid max-w-[360px] gap-y-6">
      <LayersIconFrame>
        <WorldBlueprintIcon className="size-20 overflow-hidden rounded-2xl" />
      </LayersIconFrame>

      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H6} className="text-center">
          {props.title}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R3}
          className="text-center text-grey-500"
        >
          {props.description}
        </Typography>
      </div>

      {props.children}
    </div>
  </div>
);
