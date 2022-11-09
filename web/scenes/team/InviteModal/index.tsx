import { Button } from "common/Button";
import { useToggle } from "common/hooks";
import { Modal } from "common/Modal";
import { Field, Form } from "kea-forms";
import { inviteLogic } from "logics/inviteLogic";
import { memo, useCallback } from "react";
import { Icon } from "common/Icon";
import Tags from "@yaireo/tagify/dist/react.tagify";
import cn from "classnames";
import { useActions, useValues } from "kea";
import { Link } from "common/Link";

export const InviteModal = memo(function InviteModal(props: {
  modalState: ReturnType<typeof useToggle>;
}) {
  const { isInviteValid, isInviteSubmitting } = useValues(inviteLogic);
  const { resetInvite, submitInvite } = useActions(inviteLogic);
  const handleClose = useCallback(() => {
    resetInvite();
    props.modalState.toggleOff();
  }, [props.modalState, resetInvite]);

  return (
    <Modal
      className="p-0 min-w-[512px]"
      isShown={props.modalState.isOn}
      close={handleClose}
    >
      <div className="flex items-center justify-between p-5 border-b border-f0edf9">
        <span className="text-191c20 font-semibold font-sora">
          Invite team member
        </span>

        <Button onClick={handleClose} className="h-auto">
          <Icon
            name="close"
            className="w-6 h-6 text-primary hover:opacity-75 transition-opacity"
          />
        </Button>
      </div>

      <Form formKey="invite" logic={inviteLogic} className="p-8 space-y-8">
        <div className="space-y-2">
          <label className="text-14 font-rubik font-medium">
            Invite by email
          </label>

          <Field name="emails" noStyle>
            {({ value, onChange }) => (
              <Tags
                value={value}
                onChange={(e) =>
                  onChange(e.detail.tagify.value.map((value) => value.value))
                }
                settings={{
                  editTags: false,
                  pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                }}
                className={cn("w-full rounded-[10px]")}
              />
            )}
          </Field>
        </div>

        <div className="space-y-4 text-center">
          <Button
            color="primary"
            variant="contained"
            fullWidth
            type="submit"
            disabled={isInviteSubmitting || !isInviteValid}
            onClick={submitInvite}
          >
            send invite
          </Button>

          {/* FIXME: add link */}
          <span className="block text-14 text-d1d3d4">
            https://worldcoin-dev-porta.com&nbsp;
            <Link href="#!">Copy invite link</Link>
          </span>
        </div>
      </Form>
    </Modal>
  );
});
