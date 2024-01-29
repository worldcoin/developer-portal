import { AbiEncodedValue, IDKitConfig } from "@worldcoin/idkit-core";

import {
  HashFunctionOutput,
  hashToField,
  packAndEncode,
  solidityEncode,
} from "@worldcoin/idkit-core/hashing";

export const validateABILikeEncoding = (value: string): boolean => {
  const ABI_REGEX = /^0x[\dabcdef]+$/;
  return !!value.toString().match(ABI_REGEX) && value.length >= 66; // Because `0` contains 66 characters
};

export const generateExternalNullifier = (
  app_id: IDKitConfig["app_id"],
  action: IDKitConfig["action"],
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
