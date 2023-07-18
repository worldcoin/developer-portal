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

  const mainnetAddress = await provider.resolveName("id.worldcoin.eth");
  const goerliAddress = await provider.resolveName("goerli.id.worldcoin.eth");
  const optimismAddress = await provider.resolveName(
    "optimism.id.worldcoin.eth"
  );
  const opGoerliAddress = await provider.resolveName(
    "op-goerli.id.worldcoin.eth"
  );
  const polygonAddress = await provider.resolveName("polygon.id.worldcoin.eth");
  const mumbaiAddress = await provider.resolveName("mumbai.id.worldcoin.eth");

  if (
    mainnetAddress &&
    goerliAddress &&
    optimismAddress &&
    opGoerliAddress &&
    polygonAddress &&
    mumbaiAddress
  ) {
    const mutation = gql`
      mutation upsert_cache(
        $mainnetAddress: String!
        $goerliAddress: String!
        $optimismAddress: String!
        $opGoerliAddress: String!
        $polygonAddress: String!
        $mumbaiAddress: String!
      ) {
        insert_cache(
          objects: [
            { key: "id.worldcoin.eth", value: $mainnetAddress }
            { key: "goerli.id.worldcoin.eth", value: $goerliAddress }
            { key: "optimism.id.worldcoin.eth", value: $optimismAddress }
            { key: "op-goerli.id.worldcoin.eth", value: $opGoerliAddress }
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
        mainnetAddress,
        goerliAddress,
        optimismAddress,
        opGoerliAddress,
        polygonAddress,
        mumbaiAddress,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: `An address was not found. mainnetAddress: ${mainnetAddress}, goerliAddress: ${goerliAddress}, optimismAddress: ${optimismAddress}, opGoerliAddress: ${opGoerliAddress}, polygonAddress: ${polygonAddress}, mumbaiAddress: ${mumbaiAddress}`,
    });
    return;
  }

  res.status(200).json({ success: true });
}
