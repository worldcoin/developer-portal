import { Button } from "common/Button";
import { memo } from "react";

export const Controls = memo(function Controls(props: {
  onInviteClick: () => void;
}) {
  return (
    <div>
      <Button onClick={props.onInviteClick}>Invite new members</Button>
    </div>
  );
});
