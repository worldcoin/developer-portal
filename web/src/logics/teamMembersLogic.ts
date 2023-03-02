import { actions, connect, kea, path, listeners } from "kea";
import { loaders } from "kea-loaders";
import { teamLogic, UpdateTeamInterface } from "./teamLogic";
import { gql } from "@apollo/client";
import { graphQLRequest } from "frontend-api";
import type { teamMembersLogicType } from "./teamMembersLogicType";
import { toast } from "react-toastify";

const deleteTeamMemberQuery = gql`
  mutation DeleteTeamUser($id: String!) {
    delete_user_by_pk(id: $id) {
      id
    }
  }
`;

export const teamMembersLogic = kea<teamMembersLogicType>([
  path(["logics", "teamMembersLogic"]),
  connect({ actions: [teamLogic, ["loadTeam"]] }),
  actions({
    deleteTeamMember: (id: string) => ({ id }),
  }),
  listeners(({ actions }) => ({
    deleteTeamMemberSuccess: () => {
      actions.loadTeam();
    },
  })),
  loaders(() => ({
    deletedTeamMember: [
      null as null | boolean,
      {
        deleteTeamMember: async ({ id }, breakpoint) => {
          const response = await graphQLRequest<UpdateTeamInterface>({
            query: deleteTeamMemberQuery,
            variables: { id },
          });

          if (response.data?.delete_user_by_pk?.id === id) {
            toast.success("Team member successfully deleted.");
            breakpoint();
            return true;
          }

          return false;
        },
      },
    ],
  })),
]);
