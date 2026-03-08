import { errorResponse } from "@/api/helpers/errors";
import {
  getUserOperationReceipt,
  UserOperationReceipt,
} from "@/api/helpers/temporal-rpc";
import { corsHandler } from "@/api/helpers/utils";
import { NextRequest, NextResponse } from "next/server";

const userOperationHashRegex = /^0x[a-fA-F0-9]{64}$/;

const corsMethods = ["GET", "OPTIONS"];

type UserOpStatusResponse = {
  status: "pending" | "success" | "failed";
  userOpHash: string;
  sender: string | null;
  transaction_hash: string | null;
  nonce: string | null;
};

const getTransactionHash = (receipt: UserOperationReceipt) =>
  receipt.receipt.transactionHash;

const toStatusResponse = (
  userOpHash: string,
  receipt: UserOperationReceipt | null,
): UserOpStatusResponse => {
  if (!receipt) {
    return {
      status: "pending",
      userOpHash,
      sender: null,
      transaction_hash: null,
      nonce: null,
    };
  }

  return {
    status: receipt.success ? "success" : "failed",
    userOpHash,
    sender: receipt.sender,
    transaction_hash: getTransactionHash(receipt),
    nonce: receipt.nonce,
  };
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { user_op_hash: string } },
) => {
  // This endpoint is intentionally unprotected. World Chain user operations can
  // already be fetched on-chain; this route is only a convenience wrapper for
  // developers querying World Chain user op status through the Dev Portal API.
  const userOpHash = params.user_op_hash;

  if (!userOperationHashRegex.test(userOpHash)) {
    return corsHandler(
      errorResponse({
        statusCode: 400,
        code: "invalid_parameter",
        detail: "Invalid user operation hash",
        attribute: "user_op_hash",
        req,
      }),
      corsMethods,
    );
  }

  try {
    const receipt = await getUserOperationReceipt(userOpHash);
    return corsHandler(
      NextResponse.json(toStatusResponse(userOpHash, receipt), { status: 200 }),
      corsMethods,
    );
  } catch {
    return corsHandler(
      errorResponse({
        statusCode: 500,
        code: "internal_api_error",
        detail: "Failed to fetch user operation status",
        attribute: "user_op_hash",
        req,
      }),
      corsMethods,
    );
  }
};

export async function OPTIONS() {
  return corsHandler(new NextResponse(null, { status: 204 }), corsMethods);
}
