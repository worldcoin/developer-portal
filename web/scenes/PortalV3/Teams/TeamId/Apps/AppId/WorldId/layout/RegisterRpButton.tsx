"use client";

import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import dynamic from "next/dynamic";
import { type ComponentProps, useEffect, useRef, useState } from "react";

// Show a fallback while an initially open dialog loads. Mimics the dialog
// overlay so the modal doesn't pop in from an undimmed page.
const RegisterRpDialog = dynamic(
  () =>
    import(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/EnableWorldId40/Dialog"
    ).then((module) => module.RegisterRpDialog),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[15px]">
        <SpinnerIcon className="size-6 animate-spin text-white" />
      </div>
    ),
  },
);

type RegisterRpButtonProps = Omit<
  ComponentProps<"button">,
  "onClick" | "type"
> & {
  appId: string;
  initialOpen?: boolean;
  onRegistered: () => Promise<void>;
  onSetupClosed?: (completed: boolean) => void;
};

export const RegisterRpButton = (props: RegisterRpButtonProps) => {
  const {
    appId,
    children = "Register relying party",
    disabled,
    initialOpen,
    onRegistered,
    onSetupClosed,
    ...buttonProps
  } = props;
  const [open, setOpen] = useState(Boolean(initialOpen) && !disabled);
  // Keep the dialog mounted after its first open so FormDialog can play its
  // leave transition and reset its wizard state in afterLeave.
  const [hasOpened, setHasOpened] = useState(open);
  const completedRef = useRef(false);

  useEffect(() => {
    if (initialOpen && !disabled) {
      setOpen(true);
      setHasOpened(true);
    }
  }, [disabled, initialOpen]);

  const closeDialog = () => {
    const completed = completedRef.current;
    completedRef.current = false;
    setOpen(false);
    onSetupClosed?.(completed);
  };

  return (
    <>
      <InkButton
        {...buttonProps}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(true);
          setHasOpened(true);
        }}
      >
        {children}
      </InkButton>

      {hasOpened ? (
        <RegisterRpDialog
          open={open}
          appId={appId}
          onComplete={async () => {
            completedRef.current = true;
            await onRegistered();
          }}
          onClose={closeDialog}
        />
      ) : null}
    </>
  );
};
