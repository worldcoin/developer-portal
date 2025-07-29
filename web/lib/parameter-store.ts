import {
  DescribeParametersCommand,
  DescribeParametersCommandInput,
  GetParameterCommand,
  GetParameterCommandInput,
  SSMClient,
} from "@aws-sdk/client-ssm";
import NodeCache from "node-cache";
import { logger } from "./logger";

export type SSMParameterType = "String" | "StringList" | "SecureString";

/**
 * Normalize a path component to be used as a parameter name.
 *
 * @param component - The component to normalize.
 * @returns The normalized component in kebab-case.
 */
function normalizePathComponent(component: string): string {
  return component
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // camelCase or PascalCase → dash
    .replace(/[_\s]+/g, "-") // underscores or spaces → dash
    .replace(/[^a-zA-Z0-9-]/g, "") // remove illegal chars
    .toLowerCase();
}

/**
 * Normalize a parameter name.
 *
 * @param rawName - The raw name to normalize.
 * @param prefix - The prefix to use for the parameter name.
 * @returns The normalized parameter name.
 */
function normalizeParameterName(rawName: string, prefix: string): string {
  const parts = rawName.split("/").filter(Boolean); // remove empty parts
  const normalizedParts = parts.map(normalizePathComponent);
  return `${prefix}/${normalizedParts.join("/")}`;
}

/**
 * ParameterStore is a class that provides a simple interface for interacting with AWS SSM Parameter Store.
 * It is used to retrieve and store parameters in the SSM Parameter Store.
 *
 * @param serviceName - The name of the service to use as a prefix for the parameters.
 * @param region - The region to use for the SSM client.
 */
export class ParameterStore {
  private client: SSMClient;
  private prefix: string;
  private cache: NodeCache;

  constructor(serviceName: string, region = "eu-west-1") {
    this.client = new SSMClient({ region });
    this.prefix = `/${serviceName}`;
    this.cache = new NodeCache({
      stdTTL: 60 * 30, // All parameters are cached for 30 minutes
      checkperiod: 60, // Check for expired items every 1 minute
    });
  }

  /**
   * Retrieve a parameter.
   *
   * @param name - The name of the parameter to retrieve.
   * @param defaultValue - The default value to return if the parameter is not found.
   */
  async getParameter<T = string | string[]>(
    name: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    const parameterName = normalizeParameterName(name, this.prefix);

    const cachedValue = this.cache.get(parameterName);
    if (cachedValue) {
      return cachedValue as T;
    }

    const input: GetParameterCommandInput = {
      Name: parameterName,
      WithDecryption: true,
    };

    try {
      const result = await this.client.send(new GetParameterCommand(input));
      const rawValue = result.Parameter?.Value;

      let value: T;

      if (result.Parameter?.Type === "StringList") {
        value = rawValue?.split(",") as T;
      } else {
        value = rawValue as T;
      }

      this.cache.set(parameterName, value);

      return value;
    } catch (error) {
      if (defaultValue !== undefined) {
        logger.warn(
          `Error getting parameter ${parameterName} from Parameter Store, falling back to default value`,
          {
            parameterName,
            error,
          },
        );
        return defaultValue;
      }

      logger.error(
        `Error getting parameter ${parameterName} from Parameter Store`,
        {
          parameterName,
          error,
        },
      );

      return undefined;
    }
  }

  /**
   * List all parameters under the current service prefix.
   *
   * @returns The list of parameter names.
   */
  async listParameters(): Promise<string[]> {
    const names: string[] = [];
    let nextToken: string | undefined;

    do {
      const input: DescribeParametersCommandInput = {
        ParameterFilters: [
          {
            Key: "Name",
            Option: "BeginsWith",
            Values: [this.prefix],
          },
        ],
        NextToken: nextToken,
      };

      const result = await this.client.send(
        new DescribeParametersCommand(input),
      );
      const rawNames = result.Parameters?.map((p) => p.Name).filter(
        Boolean,
      ) as string[];

      for (const fullName of rawNames) {
        const relativeName = fullName.replace(this.prefix + "/", "");
        names.push(relativeName);
      }

      nextToken = result.NextToken;
    } while (nextToken);

    return names;
  }
}
