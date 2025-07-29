import {
  DescribeParametersCommand,
  DescribeParametersCommandInput,
  GetParameterCommand,
  GetParameterCommandInput,
  SSMClient,
} from "@aws-sdk/client-ssm";

export class ParameterStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParameterStoreError";
  }
}

export class ParameterNotFoundError extends ParameterStoreError {
  constructor(parameterName: string) {
    super(`Parameter not found: ${parameterName}`);
    this.name = "ParameterNotFoundError";
  }
}

export class ParameterAlreadyExistsError extends ParameterStoreError {
  constructor(parameterName: string) {
    super(
      `Parameter already exists and overwrite is disabled: ${parameterName}`,
    );
    this.name = "ParameterAlreadyExistsError";
  }
}

export class ParameterPutError extends ParameterStoreError {
  constructor(parameterName: string, cause: unknown) {
    super(`Failed to put parameter ${parameterName}: ${String(cause)}`);
    this.name = "ParameterPutError";
  }
}

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

  constructor(serviceName: string, region = "eu-west-1") {
    this.client = new SSMClient({ region });
    this.prefix = `/${serviceName}`;
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
  ): Promise<T> {
    const paramName = normalizeParameterName(name, this.prefix);
    const input: GetParameterCommandInput = {
      Name: paramName,
      WithDecryption: true,
    };

    try {
      const result = await this.client.send(new GetParameterCommand(input));
      const rawValue = result.Parameter?.Value;

      if (result.Parameter?.Type === "StringList") {
        return rawValue?.split(",") as T;
      }

      return rawValue as T;
    } catch (error: any) {
      if (error.name === "ParameterNotFound") {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new ParameterNotFoundError(paramName);
      }
      throw error;
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
