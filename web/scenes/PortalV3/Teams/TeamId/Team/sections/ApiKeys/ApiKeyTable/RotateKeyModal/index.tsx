import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type RotateKeyModalProps = {
  isOpen: boolean;
  name?: string;
  loading: boolean;
  onConfirm: () => void;
  setIsOpen: (isOpen: boolean) => void;
};

export const RotateKeyModal = (props: RotateKeyModalProps) => {
  const { isOpen, name, loading, onConfirm, setIsOpen } = props;

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />

      <DialogPanel>
        <div className="grid grid-cols-1 justify-items-center gap-y-8 px-2 md:w-full md:max-w-100">
          <CircleIconContainer variant={"error"}>
            <WarningErrorIcon className="w-6" />
          </CircleIconContainer>

          <div className="grid w-full grid-cols-1 items-center justify-items-center gap-y-4 text-center">
            <Typography variant={TYPOGRAPHY.H6}>Are you sure?</Typography>

            {/* Consequence stays in one trailing text node so getByText can match it. */}
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Rotating{" "}
              <div className="inline-flex">
                <Typography
                  variant={TYPOGRAPHY.M3}
                  className="max-w-52 truncate text-grey-900"
                >
                  {name}
                </Typography>
              </div>{" "}
              will stop working immediately anywhere it is already deployed, and
              the new key is shown only once.
            </Typography>
          </div>

          <div className="grid w-full gap-x-4 gap-y-2 md:grid-cols-2">
            <DecoratedButton
              className="order-2 md:order-1"
              type="button"
              variant="danger"
              disabled={loading}
              onClick={onConfirm}
            >
              Rotate key
            </DecoratedButton>

            <DecoratedButton
              className="order-1 whitespace-nowrap"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Keep current key
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
