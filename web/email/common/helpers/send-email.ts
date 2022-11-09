import { sendEmail as commonSendEmail } from "@worldcoin/helpers";
import { ReactElement } from "react";
import ReactDOMServer from "react-dom/server";

const apiKey = process.env.NEXT_SERVER_EMAIL_API_KEY;
const apiSecret = process.env.NEXT_SERVER_EMAIL_API_SECRET;
const defaultFrom = process.env.NEXT_SERVER_EMAIL_FROM;

type EmailData =
  | string
  | {
      name?: string;
      email: string;
    };

/**
 * Wrapper on @worldcoin/helpers/sendEmail
 * @param data
 * @returns
 */
export const sendEmail = async (data: {
  from?: EmailData;
  to: EmailData | Array<EmailData>;
  body: ReactElement;
  subject: string;
}) => {
  if (typeof apiKey !== "string") {
    throw new Error("You need setup NEXT_SERVER_EMAIL_API_KEY in .env");
  }

  if (typeof apiSecret !== "string") {
    throw new Error("You need setup NEXT_SERVER_EMAIL_API_SECRET in .env");
  }

  if (typeof data.from !== "string" && typeof defaultFrom !== "string") {
    throw new Error("You need setup NEXT_SERVER_EMAIL_FROM in .env");
  }

  const html = ReactDOMServer.renderToString(data.body);

  return await commonSendEmail({
    ...data,
    from: (data.from ?? defaultFrom) as EmailData,
    html,
    text: html.replace(/<[^>]*>?/gm, ""),
    apiKey,
    apiSecret,
  });
};
