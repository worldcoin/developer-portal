import { hashSignal } from "@worldcoin/idkit";

import {
  AbiEncodedValue,
  HashFunctionOutput,
  packAndEncode,
  solidityEncode,
} from "@/lib/idkit";

export const generateExternalNullifier = (
  app_id: string,
  action?: AbiEncodedValue | string,
): HashFunctionOutput => {
  let hashed_app_id = hashSignal(app_id);
  if (!action) return packAndEncode([["uint256", hashed_app_id]]);
  if (typeof action === "string") action = solidityEncode(["string"], [action]);

  return packAndEncode([
    ["uint256", hashed_app_id],
    ...action.types.map(
      (type, index) =>
        [type, (action as AbiEncodedValue).values[index]] as [string, unknown],
    ),
  ]);
};
