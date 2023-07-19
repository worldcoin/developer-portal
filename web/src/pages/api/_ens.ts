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

  const addresses = [
    "id.worldcoin.eth",
    "goerli.id.worldcoin.eth",
    "optimism.id.worldcoin.eth",
    "op-goerli.id.worldcoin.eth",
    "polygon.id.worldcoin.eth",
    "mumbai.id.worldcoin.eth",
  ];

  const updateStatements = {
    params: [] as string[],
    objects: [] as string[],
    variables: {} as Record<string, string>,
  };

  for (const address of addresses) {
    const resolvedAddress = await provider.resolveName(address);
    if (resolvedAddress) {
      const addressKey = address.replaceAll(/\W/g, "");
      updateStatements.params.push(`$${addressKey}: String!`);
      updateStatements.objects.push(
        `{ key: "${address}", value: $${addressKey} }`
      );
      updateStatements.variables[addressKey] = resolvedAddress;
    } else {
      console.error(`Could not resolve ${address}.`);
    }
  }

  if (updateStatements.params.length) {
    const mutationString = `
      mutation upsert_cache(
       ${updateStatements.params.join("\n")}
      ) {
        insert_cache(
          objects: [
            ${updateStatements.objects.join("\n")}
          ]
          on_conflict: { constraint: cache_key_key, update_columns: [value] }
        ) {
          returning {
            value
          }
        }
      }
    `;

    const mutation = gql(mutationString);
    const client = await getAPIServiceClient();
    await client.query({
      query: mutation,
      variables: updateStatements.variables,
    });
  } else {
    console.error("No addresses resolved.");
  }

  res.status(200).json({ success: true });
}
