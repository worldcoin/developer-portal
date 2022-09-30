import { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "@worldcoin/helpers";
import ReactDOMServer from "react-dom/server";
import { Invite } from "email/Invite";

/**
 * Send invite to email.
 * @param req
 * @param res
 */
export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await sendEmail({
    from: "denis.bushaev@ottofeller.com",
    to: ["dez64ru@gmail.com", "dez64ru@icloud.com"],
    html: ReactDOMServer.renderToString(<Invite />),
    apiKey: "",
    apiSecret:
      "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",
    subject: "test email",
    text: "test!!!",
  });

  res.status(200).json({ status: "ok" });
}
