"use client";

import { gql, useQuery } from "@apollo/client";

export type FetchAppsForSwitcherQuery = {
  app: Array<{
    id: string;
    app_metadata: Array<{
      id: string;
      name: string;
    }>;
    verified_app_metadata: Array<{
      id: string;
      logo_img_url: string;
    }>;
  }>;
};

type FetchAppsForSwitcherVariables = {
  teamId: string;
};

const FetchAppsForSwitcherDocument = gql`
  query FetchAppsForSwitcher($teamId: String!) {
    app(where: { team_id: { _eq: $teamId } }) {
      id
      app_metadata {
        id
        name
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        id
        logo_img_url
      }
    }
  }
`;

export const useFetchAppsForSwitcherQuery = (props: { teamId?: string }) =>
  useQuery<FetchAppsForSwitcherQuery, FetchAppsForSwitcherVariables>(
    FetchAppsForSwitcherDocument,
    {
      variables: { teamId: props.teamId ?? "" },
      skip: !props.teamId,
    },
  );
