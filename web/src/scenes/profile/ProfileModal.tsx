import { FieldGroup } from "@/components/FieldGroup";
import { FieldInput } from "@/components/FieldInput";
import { Button } from "@/components/Button";
import { ModalWindowSection } from "@/components/MultiModal/ModalWindowSection";
import { memo, useEffect } from "react";
import { useToggle } from "@/hooks/useToggle";

const EMAIL_PLACEHOLDER = "no@email";

export const ProfileModal = memo(function ProfileModal() {
  const nameEdit = useToggle(false);
  const teamNameEdit = useToggle(false);

  useEffect(() => {
    return () => {
      nameEdit.toggleOff();
      teamNameEdit.toggleOff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <FieldInput readOnly value={EMAIL_PLACEHOLDER} className="mb-6" />
        </FieldGroup>
      </ModalWindowSection>
      <ModalWindowSection className="grid grid-flow-cols">
        <Button
          color="primary"
          block
          // onClick={submitProfileSettings}
          disabled={true}
        >
          Save
        </Button>
      </ModalWindowSection>
    </>
  );
});
