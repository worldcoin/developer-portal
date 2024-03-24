"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { useState } from "react";
import { DeleteAccountDialog } from "../DeleteAccountDialog";
import { Section } from "@/components/Section";

export const DangerZone = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <UserInfo />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Section>
          <Section.Header>
            <Section.Header.Title>Danger zone</Section.Header.Title>
          </Section.Header>

          <div className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              This will immediately and permanently delete your user account and
              will remove your from all your existing teams. This cannot be
              undone.
            </Typography>

            <DecoratedButton
              type="button"
              onClick={() => setOpen(true)}
              variant="danger"
              className="max-w-44 py-3"
            >
              Delete account
            </DecoratedButton>
          </div>
        </Section>
      </SizingWrapper>

      <DeleteAccountDialog open={open} onClose={setOpen} />
    </>
  );
};
