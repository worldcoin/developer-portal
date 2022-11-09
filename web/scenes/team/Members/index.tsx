import { authLogic } from "logics/authLogic";
import { Fragment, memo } from "react";
import { Item } from "./Item";
import { FieldInput } from "common/FieldInput";
import { FieldInputAddon } from "common/FieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { Icon } from "common/Icon";
import { useActions, useValues } from "kea";
import { teamLogic } from "logics/teamLogic";
import { Preloader } from "common/Preloader";
import { teamMembersLogic } from "logics/teamMembersLogic";
import { Button } from "common/Button";

export const Members = memo(function Members(props: { openModal: () => void }) {
  const { members, teamLoading } = useValues(teamLogic);
  const { deleteTeamMember } = useActions(teamMembersLogic);
  const { user } = useValues(authLogic);

  return (
    <Fragment>
      {teamLoading && <Preloader className="w-20 h-20" />}
      {!teamLoading && members && (
        <Fragment>
          <div className="grid mb-8 grid-cols-1fr/auto gap-4">
            <FieldInput
              className="pl-12"
              type="text"
              name="keyword"
              placeholder="Search for a team member..."
              defaultValue={""}
              onChange={(e) => {}}
              addon={
                <FieldInputAddon position="start">
                  <FieldInputAddonAction>
                    <Icon name="search" className="w-6 h-6 text-d1d3d4" />
                  </FieldInputAddonAction>
                </FieldInputAddon>
              }
            />
            {/* FIXME: add filter button here */}
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={props.openModal}
            >
              Invite new member
            </Button>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full overflow-x-auto border border-separate border-neutral-muted rounded-xl">
              <thead>
                <tr>
                  <th className="p-5 font-medium text-left text-14 text-neutral">
                    Name
                  </th>
                  <th className="p-5 font-medium text-left text-14 text-neutral">
                    Email
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members?.length ? (
                  members.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      onRemove={deleteTeamMember}
                      isCurrentUser={item.id === user?.id}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-5 py-12 text-center border-t text-14 text-neutral border-neutral-muted"
                      colSpan={3}
                    >
                      <span>
                        You don’t have any team members yet.{" "}
                        <button className="text-primary">
                          Invite team member
                        </button>
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
});
