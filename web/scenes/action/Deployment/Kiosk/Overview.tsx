import { Widget } from "common/Widget";
import { Button } from "common/Button";
import { memo } from "react";
import { Overview } from "scenes/action/common/Overview";

export const KioskOverview = memo(function KioskOverview(props: {
  opened?: boolean;
  onContinue: () => void;
}) {
  return (
    <Widget
      expandable
      opened={props.opened}
      title="Overview"
      description="Hosted page"
    >
      <div className="grid gap-y-14 ">
        <div className="overflow-y-auto">
          <Overview
            items={[
              { icon: "kiosk-qr-page", text: "You open the Kiosk page" },
              {
                icon: "kiosk-qr-mobile",
                text: "User scans QR code from the Kiosk",
              },
              {
                icon: "kiosk-success-page",
                text: "You receive instant confirmation",
              },
              {
                icon: "kiosk-restart-page",
                text: (
                  <div>
                    Restart.
                    <br />
                    Verify another user.
                  </div>
                ),
              },
            ]}
          />
        </div>

        <Button
          className="justify-self-center lg:justify-self-end"
          color="primary"
          variant="contained"
          fullWidth
          maxWidth="xs"
          onClick={() => props.onContinue()}
        >
          I&apos;m ready
        </Button>
      </div>
    </Widget>
  );
});
