import { Fragment, memo, useCallback } from "react";
import { Button } from "common/Button";
import { Icon } from "common/Icon";
import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldUpload } from "common/FieldUpload";
import { Modal } from "common/Modal";
import { ModalHeader } from "common/ModalHeader";
import { ModalMain } from "common/ModalMain";
import { useToggle } from "common/hooks";
import { useValues } from "kea";
import { teamLogic } from "logics/teamLogic";
import { Field, Form } from "kea-forms";
import { text } from "common/styles";
import cn from "classnames";

export function Details(): JSX.Element | null {
  const { team, isTeamSubmitting } = useValues(teamLogic);
  const requestVerificationModal = useToggle(false);

  if (!team) {
    return null;
  }

  return (
    <Form
      className="grid gap-y-9"
      logic={teamLogic}
      formKey="team"
      enableFormOnSubmit
    >
      <Field name="name">
        {({ value, onChangeEvent }) => (
          <FieldGroup label="Team name">
            <FieldInput
              type="text"
              name="name"
              placeholder="What's your team or company name?"
              value={value}
              onChange={onChangeEvent}
              disabled={isTeamSubmitting}
            />
          </FieldGroup>
        )}
      </Field>

      <div className="flex justify-end">
        <Button
          color="primary"
          variant="contained"
          fullWidth
          maxWidth="xs"
          type="submit"
          disabled={isTeamSubmitting}
        >
          Save changes
        </Button>
      </div>

      {/* FIXME: Implement request verification process */}
      {/* <Button
        className="max-w-xs"
        variant="contained"
        color={props.isTeamVerified ? "success" : "primary"}
        fullWidth
        type="button"
        disabled={false}
        onClick={requestVerificationModal.toggleOn}
      >
        {props.isTeamVerified ? (
          <span className="inline-grid grid-cols-auto/1fr gap-x-2 items-center">
            <Icon name="check" className="block w-5 h-5" />
            <span className="leading-[1px]">Verification requested</span>
          </span>
        ) : (
          "Request team verification"
        )}
      </Button> */}

      <Modal
        className="w-full max-w-[512px] p-0"
        close={requestVerificationModal.toggleOff}
        isShown={requestVerificationModal.isOn}
      >
        <ModalHeader onClose={requestVerificationModal.toggleOff}>
          Verified Actions
        </ModalHeader>
        <ModalMain className="grid gap-y-5 pb-8 font-rubik text-14 leading-5.5">
          <p>
            Verified Actions work similarly to verified accounts on Twitter, or
            when you see a checkmark in Uniswap tokens. It&apos;s used to
            provide additional context to end users to provide increased
            assurance that they are executing the action they expect and can
            help prevent spoofing of actions. A key distinction here is that a
            Verified Action only exists in the context of a single action, we
            don&apos;t verify full projects or organizations. This is because
            the only thing that ties a verified action is the action ID.
          </p>
          <p>
            When an action is verified, the metadata context (app name, action
            description and logo) for the verification request comes from our
            own server, as it contains already verified information. When the
            action is not verified, the metadata comes from.
          </p>
          <p>
            Currently we only have an invite-only list of Verified Actions,
            however we hope to open this process in the future to make it easy
            to submit your own Verified Actions to the protocol.
          </p>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="button"
            disabled={false}
            onClick={() => {
              requestVerificationModal.toggleOff();
            }}
          >
            <span className="inline-grid grid-cols-auto/1fr gap-x-2 items-center">
              <Icon name="check" className="block w-5 h-5" />
              <span className="leading-[1px]">Verification requested</span>
            </span>
          </Button>
        </ModalMain>
      </Modal>
    </Form>
  );
}
