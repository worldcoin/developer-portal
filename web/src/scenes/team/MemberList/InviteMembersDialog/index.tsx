import { memo, useCallback, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldLabel } from "@/components/FieldLabel";
import { Button } from "@/components/Button";
import { EmailsInput } from "./EmailsInput";
import { Icon } from "@/components/Icon";
import cn from "classnames";
import { DialogHeaderIcon } from "@/components/DialogHeaderIcon";
import { useInviteTeamMembers } from "@/scenes/team/hooks/useTeam";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { onClose } = props;

  const { inviteTeamMembers, loading, called, reset } = useInviteTeamMembers();

  const [emails, setEmails] = useState<string[]>([]);

  const handleSubmit = useCallback(async () => {
    await inviteTeamMembers(emails);
    reset();
    onClose();
  }, [inviteTeamMembers, emails, reset, onClose]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader
        icon={<DialogHeaderIcon icon="user-add" />}
        title="Invite New Members"
      />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel required>Invite by email</FieldLabel>

          <EmailsInput
            placeholder="Email, comma separates invite"
            disabled={loading}
            value={emails}
            onChange={setEmails}
          />
        </div>

        <Button
          className={cn("w-full gap-x-4 h-[56px] mt-12 font-medium", {
            "!text-accents-success-700 !bg-accents-success-300": called,
          })}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading && (
            <>
              <Icon name="spinner" className="h-5 w-5" />
              Sending
            </>
          )}

          {!loading && called && (
            <>
              <Icon name="check" className="h-5 w-5" />
              Invite sent
            </>
          )}

          {!loading && !called && "Send invite"}
        </Button>
      </div>
    </Dialog>
  );
});
