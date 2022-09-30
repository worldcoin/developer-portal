import { Widget } from "common/Widget";
import { memo, useCallback, useEffect, useState } from "react";
import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldInputAddon } from "common/FieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { Icon } from "common/Icon";
import { Button } from "common/Button";
import { text } from "common/styles";
import cn from "classnames";
import { useValues } from "kea";
import { actionLogic } from "logics/actionLogic";

export const KioskAccess = memo(function KioskAccess(props: {
  url?: string;
  deploymentStep?: string;
}) {
  const [kioskPageUrlCopied, setKioskPageUrlCopied] = useState(false);
  const [shouldShareAppears, setShouldShareAppears] = useState(false);
  const { currentAction } = useValues(actionLogic);

  // Determinate share support
  useEffect(() => {
    setShouldShareAppears(Boolean(window.navigator.share));
  }, []);

  useEffect(() => {
    if (kioskPageUrlCopied) {
      const timer = setTimeout(() => setKioskPageUrlCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [kioskPageUrlCopied]);

  const copyKioskPageUrl = useCallback(() => {
    props.url &&
      navigator.clipboard
        .writeText(props.url)
        .then(() => setKioskPageUrlCopied(true));
  }, [props.url]);

  const shareKioskPageUrl = useCallback(async () => {
    if (!props.url) {
      return;
    }

    try {
      await navigator.share({ url: props.url });
    } catch (err) {}
  }, [props.url]);

  return (
    <Widget expandable opened title="Kiosk access">
      <div className="grid overflow-y-auto gap-y-6">
        <FieldGroup label="Kiosk URL">
          <label className={cn(text.caption, "leading-tight")}>
            Use this URL to open the Kiosk page for this action. You don&apos;t
            have to be logged in.
          </label>
          <FieldInput
            type="text"
            name="hostedPageUrl"
            readOnly
            defaultValue={
              props.url || "Cannot load Kiosk URL. Please try again."
            }
            addon={
              props.url ? (
                <FieldInputAddon>
                  {shouldShareAppears && (
                    <FieldInputAddonAction onClick={shareKioskPageUrl}>
                      <Icon
                        name="withdraw"
                        className="w-6 h-6 text-neutral-dark"
                      />
                    </FieldInputAddonAction>
                  )}

                  <FieldInputAddonAction onClick={copyKioskPageUrl}>
                    {kioskPageUrlCopied ? (
                      <Icon name="check" className="w-6 h-6 text-success" />
                    ) : (
                      <Icon name="copy" className="w-6 h-6 text-neutral-dark" />
                    )}
                  </FieldInputAddonAction>
                </FieldInputAddon>
              ) : undefined
            }
          />
        </FieldGroup>

        {props.url && (
          <div className="justify-self-end min-w-[295px] grid gap-y-1 group">
            <Button
              color="primary"
              variant="contained"
              fullWidth
              maxWidth="xs"
              component="a"
              href={props.url}
              disabled={currentAction?.status !== "active"}
            >
              Launch Kiosk
            </Button>

            <div
              className={cn(
                "text-12 text-777e90 text-center select-none transition-visibility/opacity",
                {
                  "opacity-0 invisible group-hover:opacity-100 group-hover:visible":
                    currentAction?.status !== "active",
                },
                {
                  hidden: currentAction?.status === "active",
                }
              )}
            >
              {props.deploymentStep === "access"
                ? 'Set public description in "Display" tab first'
                : "Enable kiosk interface above first"}
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
});
