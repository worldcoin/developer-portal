import { ModalOverlay } from "common/MultiModal/ModalOverlay";
import { ModalWindow } from "common/MultiModal/ModalWindow";
import { ModalWindowHeader } from "common/MultiModal/ModalWindowHeader";
import { memo, useEffect, useState } from "react";
import { PasswordUpdate } from "scenes/passwordUpdate/passwordUpdate";
import { ProfileSettings } from "scenes/profileSettings/profileSettings";

enum ModalState {
  profileSettings,
  passwordUpdate,
}

export const ProfileSettingsModal = memo(function ProfileSettingsModal(props: {
  isOpen: boolean;
  close: () => void;
}) {
  const [modalState, setModalState] = useState(ModalState.profileSettings);

  function changePassword() {
    setModalState(ModalState.passwordUpdate);
  }

  function showProfileSettings() {
    setModalState(ModalState.profileSettings);
  }

  useEffect(() => {
    if (!props.isOpen) {
      setModalState(ModalState.profileSettings);
    }
  }, [props.isOpen]);

  return (
    <ModalOverlay isOpen={props.isOpen} close={props.close}>
      {modalState === ModalState.profileSettings && (
        <ModalWindow>
          <ModalWindowHeader
            displayCloseButton
            title="Profile settings"
            close={props.close}
            className="mb-8"
          />
          <ProfileSettings onPasswordChange={changePassword} />
        </ModalWindow>
      )}
      {modalState === ModalState.passwordUpdate && (
        <ModalWindow>
          <ModalWindowHeader
            displayCloseButton
            displayReturnButton
            title="Change password"
            close={props.close}
            handleReturn={showProfileSettings}
            className="mb-8"
          />
          <PasswordUpdate />
        </ModalWindow>
      )}
    </ModalOverlay>
  );
});
