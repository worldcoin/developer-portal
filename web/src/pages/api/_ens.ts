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
    return errorNotAllowed(req.method, res, req);
  }

  const provider = new ethers.providers.AlchemyProvider(
    "homestead",
    process.env.ALCHEMY_API_KEY
  );

  const polygonAddress = await provider.resolveName("polygon.id.worldcoin.eth");
  const mumbaiAddress = await provider.resolveName("mumbai.id.worldcoin.eth");

  if (polygonAddress && mumbaiAddress) {
    const mutation = gql`
      mutation upsert_cache($polygonAddress: String!, $mumbaiAddress: String!) {
        insert_cache(
          objects: [
            { key: "polygon.id.worldcoin.eth", value: $polygonAddress }
            { key: "mumbai.id.worldcoin.eth", value: $mumbaiAddress }
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
        polygonAddress,
        mumbaiAddress,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: `Polygon address (${polygonAddress}) or mumbai address (${mumbaiAddress}) not found.`,
    });
    return;
  }

  res.status(200).json({ success: true });
}
