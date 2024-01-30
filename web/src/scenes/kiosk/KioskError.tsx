import { memo, useMemo } from "react";
import { Button } from "src/components/Button";
import { StatusIcon } from "./common/StatusIcon";

import { IKioskStore, KioskScreen, useKioskStore } from "src/stores/kioskStore";
import {
  IKioskServerErrorCodes,
  KIOSK_SERVER_ERROR_CODES,
} from "@/pages/team/[team_id]/kiosk/[action_id]";

const getKioskStoreParams = (store: IKioskStore) => ({
  setScreen: store.setScreen,
});

export const KioskError = memo(function KioskError(props: {
  buttonText?: string;
  error_code?: IKioskServerErrorCodes;
  description?: string;
  title: string;
}) {
  const { setScreen } = useKioskStore(getKioskStoreParams);

  const details = useMemo(() => {
    if (props.description) {
      return props.description;
    }
    if (props.error_code) {
      return KIOSK_SERVER_ERROR_CODES[props.error_code];
    }
    return "Something went wrong. Please try again.";
  }, [props.error_code, props.description]);

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

        <p className="text-neutral text-[18px] leading-[1.3]">{details}</p>
      </div>

      {props.buttonText && (
        <Button
          className="min-w-[250px] max-w-full py-4 px-8"
          color="primary"
          onClick={() => setScreen(KioskScreen.Waiting)}
        >
          {props.buttonText}
        </Button>
      )}
    </div>
  );
});
