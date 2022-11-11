import { Preloader } from "common/Preloader";
import { useValues } from "kea";
import { inviteLogic } from "logics/inviteLogic";
import Signup from "pages/signup";
import { memo } from "react";

export const Invite = memo(function Invite() {
  const { invite, loading, expired, error } = useValues(inviteLogic);

  console.log({ invite, loading, expired, error });

  if (!invite) {
    return (
      <div className="w-screen h-screen grid place-content-center">
        {loading && <Preloader />}
        {expired && <p>Your invite has expired</p>}
        {error && <p>{error}</p>}
      </div>
    );
  }

  return <Signup invite={invite} />;
});
