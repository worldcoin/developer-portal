import { Preloader } from "common/Preloader";
import { useValues } from "kea";
import { Form } from "kea-forms";
import { inviteLogic } from "logics/inviteLogic";
import { memo } from "react";

export const Invite = memo(function Invite() {
  const { invite, loading, expired } = useValues(inviteLogic);

  console.log(invite, loading, expired);

  return (
    <div className="w-screen h-screen grid place-content-center">
      {loading && <Preloader className="w-40 h-40" />}

      {expired && (
        <div className="grid gap-2">
          <h1>Invite has expired</h1>
        </div>
      )}

      {!invite && <p>Invite not found</p>}

      {invite && <p>Register</p>}
    </div>
  );
});
