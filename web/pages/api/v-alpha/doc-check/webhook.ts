import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.VERIFF_PUBLIC_KEY) {
    throw new Error("VERIFF_PUBLIC_KEY is not set");
  }

  console.log(req.body);

  return res.status(204).end();
}
