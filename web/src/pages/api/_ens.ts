import { gql } from "@apollo/client";
import { ethers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { protectInternalEndpoint } from "src/backend/utils";
import { errorNotAllowed } from "../../backend/errors";

/**
 * Updates the cache for the Semaphore contracts through ENS
 * @param req
 * @param res
 */
export default async function handleENS(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  const provider = new ethers.providers.AlchemyProvider(
    "homestead",
    process.env.ALCHEMY_API_KEY
  );

  // Orb credential
  const productionAddress = await provider.resolveName("semaphore.wld.eth");
  const stagingAddress = await provider.resolveName(
    "staging.semaphore.wld.eth"
  );

  // Phone credential
  const phoneStagingAddress = await provider.resolveName(
    "staging.phone.wld.eth"
  );
  const phoneAddress = await provider.resolveName("phone.wld.eth");

  if (productionAddress && stagingAddress) {
    const mutation = gql`
      mutation upsert_cache(
        $productionAddress: String!
        $stagingAddress: String!
        $phoneAddress: String!
        $phoneStagingAddress: String!
      ) {
        insert_cache(
          objects: [
            { key: "semaphore.wld.eth", value: $productionAddress }
            { key: "staging.semaphore.wld.eth", value: $stagingAddress }
            { key: "phone.wld.eth", value: $phoneAddress }
            { key: "staging.phone.wld.eth", value: $phoneStagingAddress }
          ]
          on_conflict: { constraint: cache_key_key, update_columns: [value] }
        ) {
          returning {
            value
          }
        }
      }
    `;

    const client = await getAPIServiceClient();
    await client.query({
      query: mutation,
      variables: {
        productionAddress,
        stagingAddress,
        phoneStagingAddress,
        phoneAddress,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: `Production address (${productionAddress}) or staging address (${stagingAddress}) not found.`,
    });
    return;
  }

  res.status(200).json({ success: true });
}
