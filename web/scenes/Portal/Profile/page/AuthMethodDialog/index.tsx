import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { Connection } from "@/lib/types";
import { atom, useAtom } from "jotai";
import { EmailForm } from "./EmailForm";
import { SignInWithWorldcoin } from "./SignInWithWorldcoin";

export const authMethodDialogAtom = atom(false);

export const AuthMethodDialog = (props: { variant: Connection }) => {
  const [isOpened, setIsOpened] = useAtom(authMethodDialogAtom);

  return (
    <Dialog open={isOpened} onClose={() => setIsOpened(false)}>
      <DialogOverlay />

      <DialogPanel>
        {props.variant === Connection.Worldcoin && <SignInWithWorldcoin />}
        {props.variant === Connection.Email && <EmailForm />}
      </DialogPanel>
    </Dialog>
  );
};
