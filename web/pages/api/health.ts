import { NextApiRequest, NextApiResponse } from "next";

export default async (request: NextApiRequest, response: NextApiResponse) => {
  response.statusCode = 200;
  response.end("OK");
};
