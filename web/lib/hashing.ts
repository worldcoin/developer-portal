import { AbiEncodedValue, IDKitConfig } from "@worldcoin/idkit";

import {
  HashFunctionOutput,
  hashToField,
  packAndEncode,
  solidityEncode,
} from "@worldcoin/idkit/hashing";

export const generateExternalNullifier = (
  app_id: string,
  action?: IDKitConfig["action"],
): HashFunctionOutput => {
  if (!action) return packAndEncode([["uint256", hashToField(app_id).hash]]);
  if (typeof action === "string") action = solidityEncode(["string"], [action]);

  return packAndEncode([
    ["uint256", hashToField(app_id).hash],
    ...action.types.map(
      (type, index) =>
        [type, (action as AbiEncodedValue).values[index]] as [string, unknown],
    ),
  ]);
};
