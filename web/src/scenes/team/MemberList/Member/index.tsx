import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { memo, useMemo, useState } from "react";
import { TeamMember } from "../../hooks/useTeam";
import { Icon } from "src/components/Icon";
import { RemoveMemberDialog } from "../RemoveMemberDialog";
import { Role_Enum } from "@/graphql/graphql";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";
import { Auth0SessionUser } from "@/lib/types";

dayjs.extend(relativeTime);

export const Member = memo(function Member(props: {
  member: TeamMember;
  length: number;
}) {
  const { member, length } = props;
  const [memberForRemove, setMemberForRemove] = useState<TeamMember>();
  const { user } = useUser() as Auth0SessionUser;
  const router = useRouter();
  const { team_id } = router.query;

  const hasRemoveButton = useMemo(() => {
    const role = user?.hasura.memberships.find(
      (i) => i.team?.id === team_id
    )?.role;

    return (
      (role === Role_Enum.Owner || role === Role_Enum.Admin) &&
      member.user.id !== user?.hasura.id
    );
  }, [member.user.id, team_id, user?.hasura.id, user?.hasura.memberships]);

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
        <div className="flex gap-x-2 items-center">
          <h5>{member.user.name}</h5>{" "}
          <span className="text-12 text-657080">[{member.role}]</span>
        </div>
        <p className="text-12">{member.user.email}</p>
      </div>

      {length > 1 && hasRemoveButton && (
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
