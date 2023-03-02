import { gql } from "@apollo/client";
import { NextPageContext } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { ActionModel } from "src/lib/models";
import { Kiosk } from "src/scenes/kiosk";

interface KioskProps {
  action: Pick<
    ActionModel,
    "id" | "name" | "description" | "action" | "external_nullifier"
  > | null;
}

const actionKioskQuery = gql`
  query FetchAction($action_id: String!) {
    action(
      where: {
        id: { _eq: $action_id }
        status: { _eq: "active" }
        kiosk_enabled: { _eq: true }
      }
    ) {
      id
      name
      description
      action
      external_nullifier
      app {
        id
        name
        logo_url
        is_staging
        is_verified
      }
    }
  }
`;

export const getServerSideProps = async (context: NextPageContext) => {
  const action_id = context.query.action_id;

  const client = await getAPIServiceClient();

  return {
    props: { action_id: context.query.action_id },
  };
};

export default Kiosk;
