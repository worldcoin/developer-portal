"use client";

import { InkButton } from "@/scenes/PortalV3/common/InkButton";

type ApiKeysHeaderProps = {
  canCreate: boolean;
  disabled?: boolean;
  onCreate?: () => void;
};

export const ApiKeysHeader = (props: ApiKeysHeaderProps) => (
  <header className="flex h-8 items-center justify-between gap-4">
    <h1 className="font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
      API Keys
    </h1>

    {props.canCreate ? (
      <InkButton
        type="button"
        onClick={props.onCreate}
        disabled={props.disabled}
        className="h-8 rounded-full px-3.5 text-13 leading-[1.2] font-[550] tracking-[-0.01em]"
      >
        Create API token
      </InkButton>
    ) : null}
  </header>
);
