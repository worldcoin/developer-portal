import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import { getAPIServiceClient } from "@/backend/graphql";
import { ActionKioskType, ActionKioskQueryType } from "@/lib/types";
import { Kiosk } from "@/scenes/kiosk";

export interface KioskProps {
  action: ActionKioskType | null;
  error_code?: IKioskServerErrorCodes;
}

export const KIOSK_SERVER_ERROR_CODES = {
  action_not_found:
    "We could not find this action. It may be inactive or kiosk disabled.",
  no_sign_in: "Sign in with World ID cannot be used with the kiosk.",
};

export type IKioskServerErrorCodes = keyof typeof KIOSK_SERVER_ERROR_CODES;

const actionKioskQuery = gql`
  query FetchAction($action_id: String!) {
    action(
      where: {
        id: { _eq: $action_id }
        status: { _eq: "active" }
        kiosk_enabled: { _eq: true }
        app: { status: { _eq: "active" }, is_archived: { _eq: false } }
      }
    ) {
      id
      name
      description
      action
      external_nullifier
      app {
        id
        is_staging
        app_metadata(where: { verification_status: { _neq: "verified" } }) {
          name
          verification_status
        }
        verified_app_metadata: app_metadata(
          where: { verification_status: { _eq: "verified" } }
        ) {
          name
          logo_img_url
          verification_status
        }
      }
    }
  }
`;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const action_id = context.query.action_id;
  const client = await getAPIServiceClient();

  const { data } = await client.query<{ action: ActionKioskQueryType[] }>({
    query: actionKioskQuery,
    variables: {
      action_id,
    },
  });

  if (data?.action.length === 0) {
    return { props: { error_code: "action_not_found" } };
  }

  if (data?.action[0].action === "") {
    return { props: { error_code: "no_sign_in" } };
  }
  const { app_metadata, verified_app_metadata, ...app_data } =
    data.action[0].app;
  const app_metadata_item = verified_app_metadata?.[0] ?? {
    ...app_metadata?.[0],
    logo_img_url: "",
  };
  const processedAction: ActionKioskType = {
    ...data.action[0],
    app: {
      ...app_data,
      app_metadata: app_metadata_item,
    },
  };

  return {
    props: { action: processedAction } as KioskProps,
  };
};

export default Kiosk;
