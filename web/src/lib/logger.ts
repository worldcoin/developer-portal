import { IncomingMessage } from "http";
import { NextApiRequest } from "next";
import winston from "winston";

const apiKey = process.env.NEXT_SERVER_DD_API_KEY;
const serviceName = process.env.NEXT_SERVER_DD_SERVICE_NAME;

const httpTransportOptions = {
  host: "http-intake.logs.datadoghq.com",
  path: `/api/v2/logs?dd-api-key=${apiKey}&ddsource=nodejs&service=${serviceName}`,
  ssl: true,
};

const transports: winston.LoggerOptions["transports"] = [
  new winston.transports.Console(),
];

const errorFormatter = winston.format((info) => {
  return {
    ...info,

    // Winston doesn't serialize Error objects well
    ...(info.error instanceof Error
      ? {
          error: { message: info.error.message, stack: info.error.stack },
          message: info.message || info.error.message,
        }
      : {}),

    // Calling logger.error({error: new Error('Some error')}) will produce {message: {error: ...}}
    ...(info.message instanceof Object && info.message?.error instanceof Error
      ? {
          error: {
            message: info.message.error?.message,
            stack: info.message.error?.stack,
          },
          message: info.message.error.message,
        }
      : {}),
  };
});

const vercelFormatter = winston.format(
  (info: winston.Logform.TransformableInfo) => {
    const { req, ...restInfo } = info as winston.Logform.TransformableInfo & {
      req: NextApiRequest;
    };

    if (!process.env.VERCEL || !req) {
      return restInfo;
    }

    if (req) {
      let body = req.body;
      if (req.headers["content-type"]?.includes("application/json")) {
        try {
          body = JSON.parse(req.body);
        } catch {}
      }
      return {
        ...restInfo,
        env: process.env.NODE_ENV,
        userAgent: req.headers["user-agent"],
        method: req.method,
        url: req.url,
        query: req.query,
        body,
      };
    }

    return restInfo;
  }
);

if (process.env.NODE_ENV === "production") {
  transports.push(new winston.transports.Http(httpTransportOptions));
} else {
  transports.push(new winston.transports.Console());
}

export const logger = winston.createLogger({
  level: "info",
  exitOnError: false,
  format: winston.format.combine(
    errorFormatter(),
    vercelFormatter(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});
