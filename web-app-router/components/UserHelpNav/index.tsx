import { memo } from "react";

export const UserHelpNav = memo(function UserHelpNav(props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div>Help</div>
      <div>Docs</div>
      <div>User</div>
    </div>
  );
});
