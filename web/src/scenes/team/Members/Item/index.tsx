import { memo, useCallback } from "react";
import { Icon } from "src/common/Icon";
import { TeamType } from "src/lib/types";
import { useValues } from "kea";
import { teamMembersLogic } from "src/logics/teamMembersLogic";

export const Item = memo(function Item(props: {
  item: TeamType["users"][number];
  onRemove: (id: string) => void;
  isCurrentUser?: boolean;
}) {
  const { deletedTeamMemberLoading } = useValues(teamMembersLogic);

  const remove = useCallback(() => {
    props.onRemove(props.item.id);
  }, [props]);

  return (
    <tr>
      <td className="h-16 px-5 border-t border-neutral-muted">
        <span className="grid grid-cols-auto/1fr gap-x-4 items-center">
          <span className="grid items-center justify-center w-10 h-10 bg-fcfbfe border border-f1f5f8 rounded-full">
            <Icon name="user" className="w-6 h-6 text-primary" />
          </span>
          <span className="font-medium text-16">
            {props.item.name}
            {props.isCurrentUser && " (You)"}
          </span>
        </span>
      </td>
      <td className="h-16 px-5 border-t border-neutral-muted text-neutral">
        {props.item.email}
      </td>
      <td className="h-16 px-5 text-right border-t border-neutral-muted">
        {!props.isCurrentUser && (
          <button
            className="p-3 text-danger disabled:opacity-20"
            onClick={remove}
            disabled={deletedTeamMemberLoading}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
});
