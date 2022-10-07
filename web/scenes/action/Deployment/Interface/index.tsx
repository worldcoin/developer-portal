import { memo, ReactNode, useCallback } from "react";
import { UserInterfacesType } from "types";
import { useToggle } from "common/hooks";
import cn from "classnames";
import { InterfaceHeader } from "./InterfaceHeader";
import { InterfaceOverview } from "./InterfaceOverview";
import { Icon, IconType } from "common/Icon";
import { Button } from "common/Button";
import { Switch } from "common/Switch";
import { Field } from "kea-forms";
import { Modal } from "common/Modal";
import { Footer } from "common/Footer";

interface InterfaceInterface {
  className?: string;
  icon: IconType;
  title: string;
  description: string;
  enabled?: boolean;
  overviewItems: Array<{
    icon: IconType;
    text: ReactNode;
  }>;
  children?: ReactNode;
  name: UserInterfacesType;
  instructions?: ReactNode;
}

export const Interface = memo(function Interface(props: InterfaceInterface) {
  const deploymentInstructionsModal = useToggle();

  const handleClickDone = useCallback(
    (onChange: (value: boolean) => void) => () => {
      onChange(true);
      deploymentInstructionsModal.toggleOff();
    },
    [deploymentInstructionsModal]
  );

  return (
    <div className="mb-2 bg-ffffff border border-neutral-muted rounded-xl">
      <InterfaceHeader
        icon={props.icon}
        title={props.title}
        description={props.description}
      >
        <Button
          className="grid grid-flow-col gap-x-2 h-[34px] !font-rubik !font-medium border-primary/10 bg-primary/5"
          variant="outlined"
          color="primary"
          size="md"
          type="button"
          onClick={deploymentInstructionsModal.toggleOn}
        >
          Show deployment instructions
          <Icon name="arrow-right" className={cn("w-4 h-4")} />
        </Button>
        <Field noStyle name={props.name}>
          {({ value, onChange }) => (
            <Switch
              checked={value}
              onChangeChecked={(value) => onChange(value)}
            />
          )}
        </Field>
      </InterfaceHeader>
      {props.enabled && props.children && (
        <div className="pt-6 pl-8 pr-8 pb-8 border-t border-neutral-muted">
          {props.children}
        </div>
      )}
      <InterfaceOverview
        icon={props.icon}
        title={props.title}
        overviewItems={props.overviewItems}
      />

      <Modal
        containerClassName="left-[304px] right-0! !p-0"
        className={cn(
          "flex flex-col !min-w-full !max-w-none w-full min-h-full p-0 rounded-none overflow-y-auto bg-fbfbfb"
        )}
        close={deploymentInstructionsModal.toggleOff}
        isShown={deploymentInstructionsModal.isOn}
      >
        <div className="grow px-4 lg:px-8 xl:px-16 py-8">
          <div className="mb-2 bg-ffffff border border-neutral-muted rounded-xl">
            <InterfaceHeader
              icon={props.icon}
              title={props.title}
              description={props.description}
            />
            <InterfaceOverview
              icon={props.icon}
              title={props.title}
              overviewItems={props.overviewItems}
            />
          </div>
          <h2 className="mt-8 mb-4 font-sora font-semibold text-20 leading-6">
            Deployment instructions
          </h2>
          {props.instructions}
        </div>
        <Footer>
          <Button
            className={cn(
              "justify-self-start grid grid-flow-col gap-x-2 h-12 !px-12 !font-rubik !font-medium border-primary/10 bg-primary/5"
            )}
            variant="outlined"
            color="primary"
            size="md"
            type="button"
            onClick={deploymentInstructionsModal.toggleOff}
          >
            BACK TO CONFIGURATION
          </Button>
          <Field noStyle name={props.name}>
            {({ onChange }) => (
              <Button
                className={cn(
                  "justify-self-end grid grid-flow-col gap-x-2 h-12 !px-12 !font-semibold uppercase"
                )}
                variant="contained"
                color="primary"
                size="md"
                type="button"
                onClick={handleClickDone(onChange)}
              >
                I’ve done this
              </Button>
            )}
          </Field>
        </Footer>
      </Modal>
    </div>
  );
});
