import ddTrace from "dd-trace";
import { IncomingMessage } from "http";
import { NextApiRequest } from "next";
import winston from "winston";

const apiKey = process.env.NEXT_SERVER_DD_API_KEY;
const serviceName = process.env.NEXT_SERVER_DD_SERVICE_NAME;

const httpTransportOptions = {
  host: "http-intake.logs.datadoghq.com",
  path: `/api/v2/logs?dd-api-key=${apiKey}&ddsource=nodejs&service=${serviceName}&env=${
    process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? undefined
  }`,
  ssl: true,
};

const transports: winston.LoggerOptions["transports"] = [];

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

if (process.env.NODE_ENV === "production") {
  transports.push(new winston.transports.Http(httpTransportOptions));
} else {
  transports.push(new winston.transports.Console());
}

const _logger = winston.createLogger({
  level: "info",
  exitOnError: false,
  format: winston.format.combine(
    errorFormatter(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
});

// NOTE: this is wrapper and formatter for debug request data (this is workaround, because winston don't support async formatters)
async function requestFormatter(req: NextApiRequest | IncomingMessage) {
  if (!req) {
    return {};
  }

  const ip =
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"] ||
    "IP not available";
  const url = req.url?.replace(/\?.*$/, "");
  const method = req.method;
  const userAgent = req.headers["user-agent"];

  const query = req.url?.includes("?")
    ? Object.fromEntries(
        new URLSearchParams(req.url?.replace(/^.*\?/, "")).entries(),
      )
    : {};

  let body: any = null;

  if ("body" in req) {
    body = req.body;
  } else {
    body = await (async () =>
      await new Promise<string>((resolve) => {
        let data: Array<any> = [];
        req
          .on("data", (chunk) => data.push(chunk))
          .on("end", () => {
            resolve(Buffer.concat(data).toString("utf8"));
          });
      }))();
  }

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  if (
    (typeof body === "string" && body === "") ||
    (body && typeof body === "object" && Object.keys(body).length === 0)
  ) {
    body = null;
  }

  return {
    body,
    env: process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? undefined,
    host: process.env.VERCEL_URL ?? undefined,
    ip,
    method,
    query,
    url,
    userAgent: userAgent,
  };
}

async function loggerWrapper(
  handler: "error" | "warn" | "info" | "debug",
  msg: string,
  data?: Record<string, any>,
) {
  if (data && data.req) {
    data.request = await requestFormatter(data.req);
    delete data.req;
  }

  // Handle error tracing for error logs
  if (handler === "error") {
    const span = ddTrace.scope().active();
    if (span) {
      let error: Error | undefined;

      // Check all possible error locations
      if (data?.error instanceof Error) {
        error = data.error;
      } else {
        error = new Error(msg);
      }

      if (error) {
        span.setTag("error", error);
      }
    }
  }

  _logger[handler](msg, data);
}

export const logger = {
  error: (msg: string, data?: Record<string, any>) =>
    loggerWrapper("error", msg, data),

  warn: (msg: string, data?: Record<string, any>) =>
    loggerWrapper("warn", msg, data),

  info: (msg: string, data?: Record<string, any>) =>
    loggerWrapper("info", msg, data),

  debug: (msg: string, data?: Record<string, any>) =>
    loggerWrapper("debug", msg, data),
};
