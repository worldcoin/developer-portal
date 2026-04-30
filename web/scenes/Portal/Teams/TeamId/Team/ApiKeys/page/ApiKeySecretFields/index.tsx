"use client";

import { CopyButton } from "@/components/CopyButton";
import { Input } from "@/components/Input";

export const getClaudeMcpCommand = (apiKey: string) =>
  `claude mcp add --transport http --scope project worldcoin-developer-portal https://developer.world.org/api/mcp --header "Authorization: Bearer ${apiKey}"`;

export const ApiKeySecretFields = (props: { apiKey: string }) => {
  const { apiKey } = props;
  const claudeMcpCommand = getClaudeMcpCommand(apiKey);

  return (
    <>
      <Input
        label="API key"
        value={apiKey}
        readOnly
        disabled
        className="h-16"
        helperText="Save this API key. You won't be able to see it again."
        addOnRight={<CopyButton fieldName="API Key" fieldValue={apiKey} />}
      />

      <Input
        label="Claude MCP"
        value={claudeMcpCommand}
        readOnly
        disabled
        className="h-16"
        addOnRight={
          <CopyButton
            fieldName="Claude MCP command"
            fieldValue={claudeMcpCommand}
          />
        }
      />
    </>
  );
};
