import { memo, useCallback, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldLabel } from "@/components/FieldLabel";
import { Button } from "@/components/Button";
import { EmailsInput } from "./EmailsInput";
import { Icon } from "@/components/Icon";
import cn from "classnames";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    // FIXME: implement submit and remove setTimeout
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  }, []);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader icon="user-add" title="Invite New Members" />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel required>Invite by email</FieldLabel>

          <EmailsInput
            placeholder="Email, comma separates invite"
            disabled={isSubmitting}
            value={emails}
            onChange={setEmails}
          />
        </div>

        <Button
          className={cn("w-full gap-x-4 h-[56px] mt-12 font-medium", {
            "!text-accents-success-700 !bg-accents-success-300": isSubmitted,
          })}
          disabled={isSubmitting || isSubmitted}
          onClick={handleSubmit}
        >
          {isSubmitting && (
            <>
              <Icon name="spinner" className="h-5 w-5" />
              Sending
            </>
          )}
          {!isSubmitting && isSubmitted && (
            <>
              <Icon name="check" className="h-5 w-5" />
              Invite sent
            </>
          )}
          {!isSubmitting && !isSubmitted && "Send invite"}
        </Button>
      </div>
    </Dialog>
  );
});
