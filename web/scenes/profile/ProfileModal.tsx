import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/LegacyFieldInput";
import { Button } from "common/LegacyButton";
import { ModalWindowSection } from "common/MultiModal/ModalWindowSection";
import { memo, useEffect } from "react";
import { useToggle } from "hooks/useToggle";

const EMAIL_PLACEHOLDER = "no@email";

export const ProfileModal = memo(function ProfileModal() {
  const nameEdit = useToggle(false);
  const teamNameEdit = useToggle(false);

  useEffect(() => {
    return () => {
      nameEdit.toggleOff();
      teamNameEdit.toggleOff();
    };
  }, []);
  // FIXME: Wire up this page
  return (
    <>
      <ModalWindowSection>
        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Email</span>
            </div>
          }
        >
          <FieldInput
            variant="small"
            readOnly
            value={EMAIL_PLACEHOLDER}
            className="mb-6"
          />
        </FieldGroup>
      </ModalWindowSection>
      <ModalWindowSection className="grid grid-flow-cols">
        <Button
          color="primary"
          variant="contained"
          fullWidth
          // onClick={submitProfileSettings}
          disabled={true}
        >
          Save
        </Button>
      </ModalWindowSection>
    </>
  );
});
