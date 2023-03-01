import { Illustration } from "common/Auth/Illustration";
import { Button } from "common/Button";
import { Dialog } from "common/Dialog";
import { FieldGroup } from "common/FieldGroup";
import { Icon } from "common/Icon";
import { TagsField } from "common/TagsField";
import { FormEvent, memo, useCallback } from "react";
import {
  getTeamStore,
  InviteMembersState,
  useTeamStore,
} from "scenes/team/store";

const emailRegEx = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    inviteMembers,
    membersForInvite,
    setMembersForInvite,
    inviteMembersStatus,
  } = useTeamStore(getTeamStore);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await inviteMembers();
    },
    [inviteMembers]
  );

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-12">
          <div className="flex flex-col items-center space-y-6">
            <Illustration icon="user-plus" />

            <span className="text-24 font-sora font-semibold">
              Invite New Members
            </span>
          </div>

          <FieldGroup label={"Invite by email"}>
            <TagsField
              value={membersForInvite}
              onChange={setMembersForInvite}
              validate={(v: string) => emailRegEx.test(v)}
              disabled={inviteMembersStatus === InviteMembersState.LOADING}
            />
          </FieldGroup>
        </div>

        <div className="space-y-12 ">
          {inviteMembersStatus === null && (
            <Button
              type="submit"
              disabled={membersForInvite.length <= 0}
              className="w-full py-4.5 px-9"
            >
              Send Invite
            </Button>
          )}

          {inviteMembersStatus === InviteMembersState.LOADING && (
            <Button
              className="!bg-ebecef !text-657080 w-full py-4.5 px-9 gap-4"
              disabled
            >
              <Icon
                name="spinner-gradient"
                className="w-5 h-5 animate-spin bg-657080"
              />
              Sending
            </Button>
          )}

          {inviteMembersStatus === InviteMembersState.SUCCESS && (
            <Button
              disabled
              className="w-full py-4.5 px-9 !bg-success-light text-success gap-4"
            >
              <Icon name="check" className="w-5 h-5 bg-success" />
              Invite sent
            </Button>
          )}

          <div className="text-14 space-x-2 text-center">
            <span>https://worldcoin-dev-portal.com</span>

            <button
              type="button"
              className="text-primary hover:opacity-75 transition-opacity"
              // FIXME: implement link
              onClick={() =>
                navigator.clipboard.writeText(
                  "https://worldcoin-dev-portal.com"
                )
              }
            >
              Copy invite link
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
});
