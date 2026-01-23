"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldBlueprintIcon } from "@/components/Icons/WorldBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { createAppDialogOpenedAtom } from "@/scenes/Portal/layout/Header";
import { useAtom } from "jotai";
import { Fragment } from "react";

export const NewClientPage = () => {
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);

  return (
    <Fragment>
      <SizingWrapper gridClassName="grow flex justify-center items-center pb-10">
        <div className="grid w-full max-w-[580px] gap-y-6">
          <LayersIconFrame>
            <WorldBlueprintIcon />
          </LayersIconFrame>

          <div className="grid gap-y-3">
            <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
              Create a new app
            </Typography>

            <Typography
              as="p"
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              Set up your app, and get the credentials
              <br />
              you need to integrate World ID.
            </Typography>
          </div>

          <DecoratedButton
            type="button"
            onClick={() => setCreateAppDialogOpen(true)}
            className="w-[180px] justify-self-center py-4"
            testId="create-an-app"
          >
            <Typography variant={TYPOGRAPHY.M3}>Get started</Typography>
          </DecoratedButton>
        </div>
      </SizingWrapper>
    </Fragment>
  );
};
