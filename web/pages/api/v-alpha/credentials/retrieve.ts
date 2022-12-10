import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { errorRequiredAttribute, errorValidation } from "errors";
import { NextApiRequest, NextApiResponse } from "next";
import { Credentials, CredentialType } from "types";

// FIXME: Currently these endpoints assume only staging environment. We need to add support for production

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { identity_commitment, credential_type } = req.body;

  if (!identity_commitment) {
    return errorRequiredAttribute("identity_commitment", res);
  }

  if (credential_type !== Credentials.Identity) {
    return errorValidation(
      "invalid_credential_type",
      "Only `identity` credentials supported atm.",
      "credential_type",
      res
    );
  }

  // Store session ID in the database so we can later match it to the callback
  const query = gql`
    query RetrieveCredential(
      $identity_commitment: String!
      $credential_type: String!
    ) {
      credential(
        where: {
          identity_commitment: { _eq: $identity_commitment }
          credential_type: { _eq: $credential_type }
        }
      ) {
        identity_commitment
        credential_type
        error_details
        status
        credential_data
      }
    }
  `;

  const client = await getAPIServiceClient();
  const {
    data: { credential },
  } = await client.query<{ credential: CredentialType[] }>({
    query,
    variables: {
      identity_commitment,
      credential_type,
    },
  });

  return res.status(200).json(credential);
}
