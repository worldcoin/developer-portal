import { memo } from "react";
import { StatusIcon } from "../StatusIcon";
import { Button } from "common/LegacyButton";

export const KioskError = memo(function KioskError(props: {
  buttonText?: string;
  description?: string;
  setScreen: (screen: string) => void;
  title: string;
}) {
  return (
    <div className="grid text-center justify-items-center gap-y-12">
      <StatusIcon icon="close" />

      <div className="grid gap-y-4">
        <h2 className="text-neutral-dark font-sora text-[26px] leading-[1.2] font-semibold">
          {props.title}
        </h2>

        {props.description && (
          <p className="text-neutral text-[18px] leading-[1.3]">
            {props.description}
          </p>
        )}
      </div>

      {props.buttonText && (
        <Button
          className="min-w-[250px] max-w-full"
          variant="contained"
          color="primary"
          onClick={() => props.setScreen("intro")}
        >
          {props.buttonText}
        </Button>
      )}
    </div>
  );
});
