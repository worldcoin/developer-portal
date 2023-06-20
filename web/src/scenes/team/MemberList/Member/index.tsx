import cn from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Fragment, memo, MouseEvent as ReactMouseEvent, useState } from "react";
import { InfoField } from "src/scenes/team/KeyList/Key/InfoField";
import { APIKeyModel } from "src/lib/models";
import { Button } from "src/components/Button";
import { Switch } from "src/components/Switch";
import useKeys from "src/hooks/useKeys";
import { toast } from "react-toastify";
import { TeamMember } from "../../hooks/useTeam";
import { Icon } from "src/components/Icon";
import { RemoveMemberDialog } from "../RemoveMemberDialog";

dayjs.extend(relativeTime);

export const Member = memo(function Member(props: {
  member: TeamMember;
  length: number;
}) {
  const { member, length } = props;
  const [memberForRemove, setMemberForRemove] = useState<TeamMember>();

  return (
    <div className="flex items-center bg-ffffff rounded-xl shadow-lg p-4 gap-3">
      <RemoveMemberDialog
        memberForRemove={memberForRemove}
        onClose={() => setMemberForRemove(undefined)}
      />
      <div className="relative w-10 h-10 grid place-items-center bg-success-light rounded-full">
        <Icon name="user-solid" className="w-4 h-4 bg-success" />

        {/* FIXME: add verified flag to hasura */}
        {/*{member.verified && (*/}
        {/*  <Icon*/}
        {/*    name="badge-verification"*/}
        {/*    className="absolute w-5 h-5 -bottom-1 -right-1"*/}
        {/*    noMask*/}
        {/*  />*/}
        {/*)}*/}
      </div>

      <div className="flex-1 space-y-1">
        <h5>{member.name}</h5>
        <p className="text-12">{member.email}</p>
      </div>

      {length > 1 && (
        <button
          className="text-danger hover:opacity-75 transition-opacity"
          onClick={() => setMemberForRemove(member)}
        >
          Remove
        </button>
      )}
    </div>
  );
});
