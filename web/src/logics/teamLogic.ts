import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { kea, path, actions, listeners, afterMount, selectors } from "kea";
import { forms } from "kea-forms";
import { loaders } from "kea-loaders";
import { toast } from "react-toastify";
import { TeamType } from "src/lib/types";
import type { teamLogicType } from "./teamLogicType";
import { isSSR } from "src/lib/utils";

interface TeamQueryResponse {
  team: Array<TeamType>;
}
export interface UpdateTeamInterface {
  update_team_by_pk: TeamType;
  delete_team_by_pk?: {
    id: string;
  };
  delete_user_by_pk?: {
    id: string;
  };
}

export const teamQueryParams = `
  id
  name
  users {
    id
    name
    email
  }
`;

const teamQuery = gql`
  query Team {
    team {
      ${teamQueryParams}
    }
  }
`;

const updateTeamQuery = gql`
  mutation UpdateTeam($id: String!, $name: String!) {
    update_team_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
      ${teamQueryParams}
    }
  }
`;

const deleteTeamQuery = gql`
  mutation DeleteTeam($id: String!) {
    delete_team_by_pk(id: $id) {
      id
    }
  }
`;

export const teamLogic = kea<teamLogicType>([
  path(["logics", "teamLogic"]),
  actions({
    deleteTeam: true,
  }),
  listeners(({ actions }) => ({
    deleteTeamUserSuccess: () => {
      actions.loadTeam();
    },
  })),
  forms(({ values }) => ({
    team: {
      defaults: { name: "" } as TeamType,
      submit: async (payload, breakpoint) => {
        if (!values.team || !payload) {
          return null;
        }

        breakpoint();
        const response = await graphQLRequest<UpdateTeamInterface>({
          query: updateTeamQuery,
          variables: {
            id: values.team.id,
            name: payload.name,
          },
        });

        toast.success("Team updated successfully!");
        return response.data?.update_team_by_pk || null;
      },
    },
  })),
  loaders(({ values }) => ({
    team: [
      null as null | TeamType,
      {
        loadTeam: async () => {
          const response = await graphQLRequest<TeamQueryResponse>({
            query: teamQuery,
          });

          return response.data?.team[0] ?? null;
        },
      },
    ],
    deletedTeam: [
      null as null | boolean,
      {
        deleteTeam: async (_, breakpoint) => {
          if (isSSR() || !values.team) {
            return null;
          }

          const response = await graphQLRequest<UpdateTeamInterface>({
            query: deleteTeamQuery,
            variables: { id: values.team.id },
          });

          if (response.data?.delete_team_by_pk?.id === values.team.id) {
            toast.success(
              "Your team and all related data has been successfully deleted."
            );
            await breakpoint(2000);
            //window.location.href = "/logout";
            return true;
          }
          return false;
        },
      },
    ],
  })),
  selectors({
    members: [(s) => [s.team], (team) => []],
  }),
  afterMount(({ actions }) => {
    actions.loadTeam();
  }),
]);
