import { ModalOverlay } from "src/components/MultiModal/ModalOverlay";
import { ModalWindow } from "src/components/MultiModal/ModalWindow";
import { ModalWindowHeader } from "src/components/MultiModal/ModalWindowHeader";
import { memo, useEffect, useState } from "react";
import { ProfileModal } from "src/scenes/profile/ProfileModal";

enum ModalState {
  profileSettings,
}

export const ProfileSettingsModal = memo(function ProfileSettingsModal(props: {
  isOpen: boolean;
  close: () => void;
}) {
  const [modalState, setModalState] = useState(ModalState.profileSettings);

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
            title="Your Account"
            close={props.close}
            className="mb-8"
          />
          <ProfileModal />
        </ModalWindow>
      )}
    </ModalOverlay>
  );
});
