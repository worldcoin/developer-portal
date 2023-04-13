import {
  useTeamsQuery,
  TeamsDocument,
} from "@/scenes/team/graphql/teams.generated";
import { useUpdateTeamNameMutation } from "@/scenes/team/graphql/updateTeamName.generated";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useDeleteTeamMemberMutation } from "@/scenes/team/graphql/deleteTeam.generated";
import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import useSWRMutation from "swr/mutation";
import { useKeyStore } from "src/stores/keyStore";

export type Team = NonNullable<
  NonNullable<ReturnType<typeof useTeamsQuery>["data"]>["teams"]
>[0];
export type TeamMember = NonNullable<Team["members"]>[0];

export const useTeam = () => {
  const { data, ...other } = useTeamsQuery();
  const [apiKey, setAPIKey] = useState<string | null>(null);

  const { trigger: resetAPIKey } = useSWRMutation(
    ["redirect", data?.teams[0]?.id],
    resetAPIKeyFetcher,
    {
      onSuccess: (apiKey) => {
        if (apiKey) {
          setAPIKey(apiKey);
          toast.success("API key has been reset");
        }
      },
    }
  );

  return {
    data: data?.teams[0],
    ...other,
    apiKey,
    resetAPIKey,
  };
};

export const useUpdateTeamName = () => {
  const [mutateFunction, other] = useUpdateTeamNameMutation({
    refetchQueries: [{ query: TeamsDocument }],
    onCompleted: () => {
      toast.success("Team updated");
    },
  });

  const updateTeamName = useCallback(
    (id: string, name: string) => {
      return mutateFunction({
        variables: {
          id,
          name,
        },
      });
    },
    [mutateFunction]
  );

  return {
    updateTeamName,
    ...other,
  };
};

// TODO: In practice we currently only support 1 user = 1 team, when we change this we need to update this query to just remove the user from the team
export const useDeleteTeamMember = () => {
  const [mutateFunction, other] = useDeleteTeamMemberMutation({
    refetchQueries: [{ query: TeamsDocument }],
    onCompleted: () => {
      toast.success("Member removed");
    },
  });

  const deleteTeamMember = useCallback(
    (id: string) => {
      return mutateFunction({
        variables: {
          id,
        },
      });
    },
    [mutateFunction]
  );

  return {
    deleteTeamMember,
    ...other,
  };
};

const ResetAPIKeyMutation = gql`
  mutation ResetAPIKey($key_id: String!) {
    reset_api_key(key_id: $key_id) {
      api_key
    }
  }
`;

const resetAPIKeyFetcher = async (_key: [string, string | undefined]) => {
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    reset_api_key: { api_key: string };
  }>({
    query: ResetAPIKeyMutation,
    variables: { key_id: currentKey.id },
  });

  if (response.data?.reset_api_key.api_key) {
    return response.data.reset_api_key.api_key;
  }

  throw new Error("Failed to reset API key.");
};
