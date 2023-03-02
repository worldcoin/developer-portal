import { memo } from "react";
import { Button } from "src/components/Button";
import { StatusIcon } from "../StatusIcon";

import { getKioskStore, Screen, useKioskStore } from "src/stores/kioskStore";

export const KioskError = memo(function KioskError(props: {
  buttonText?: string;
  description?: string;
  title: string;
}) {
  const { setScreen } = useKioskStore(getKioskStore);

  return (
    <div className="grid text-center justify-items-center gap-y-6">
      <StatusIcon
        icon="close"
        className="bg-warning-light"
        iconClassname="text-warning"
      />

      <div className="grid gap-y-2">
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
          className="min-w-[250px] max-w-full py-4 px-8"
          color="primary"
          onClick={() => setScreen(Screen.Waiting)}
        >
          {props.buttonText}
        </Button>
      )}
    </div>
  );
});
