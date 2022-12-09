import { errorRequiredAttribute } from "errors";
import { NextApiRequest, NextApiResponse } from "next";

const VERIFF_BASE_URL = "https://stationapi.veriff.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.VERIFF_PUBLIC_KEY) {
    throw new Error("VERIFF_PUBLIC_KEY is not set");
  }

  const { identity_commitment } = req.body;

  if (!identity_commitment) {
    return errorRequiredAttribute("identity_commitment", res);
  }

  const veriffResponse = await fetch(`${VERIFF_BASE_URL}/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AUTH-CLIENT": process.env.VERIFF_PUBLIC_KEY,
    },
    body: JSON.stringify({
      verification: {
        timestamp: new Date().toISOString(),
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/v-alpha/kyc-webhook`,
        vendorData: identity_commitment, // FIXME: something even more private
        document: {
          type: "PASSPORT",
        },
      },
    }),
  });

  if (!veriffResponse.ok) {
    console.warn(
      "Veriff response not ok",
      veriffResponse.status,
      await veriffResponse.json()
    );
    return res.status(500).end();
  }

  const {
    verification: { url },
  } = await veriffResponse.json();

  return res.status(200).json({ url });
}
