import { NextApiRequest, NextApiResponse } from "next";

export default async function (
  _request: NextApiRequest,
  response: NextApiResponse
) {
  response.statusCode = 200;
  response.end("OK");
}
