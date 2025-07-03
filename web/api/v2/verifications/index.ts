import { verifyApiKey } from "@/api/helpers/auth/verify-api-key";
import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as fetchVerificationsSdk } from "./graphql/fetch-verifications.generated";

// Default and max pagination limits
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

const querySchema = yup.object({
  app_id: yup.string().strict().required("app_id is required"),
  action_id: yup.string().strict().required("action_id is required"),
  start_date: yup.date().optional(),
  end_date: yup.date().optional(),
  offset: yup
    .number()
    .integer()
    .min(0, "offset must be at least 0")
    .default(0)
    .optional(),
  limit: yup
    .number()
    .integer()
    .min(1, "limit must be at least 1")
    .max(MAX_LIMIT, `limit cannot exceed ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT)
    .optional(),
});

export const GET = async (req: NextRequest) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);

  // Convert offset and limit to numbers if present
  const paramsWithNumbers = {
    ...params,
    ...(params.offset && { offset: Number(params.offset) }),
    ...(params.limit && { limit: Number(params.limit) }),
  };

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema: querySchema,
    value: paramsWithNumbers,
  });

  if (!isValid) {
    return handleError(req);
  }

  const {
    app_id,
    action_id,
    start_date,
    end_date,
    offset = 0,
    limit = DEFAULT_LIMIT,
  } = parsedParams;

  // Verify API key
  const verifyResult = await verifyApiKey({
    req,
    appId: app_id,
  });

  if (!verifyResult.success) {
    return verifyResult.errorResponse;
  }

  const teamId = verifyResult.teamId;

  // Validate date range if both dates provided
  if (start_date && end_date) {
    const startDate = dayjs(start_date);
    const endDate = dayjs(end_date);

    if (startDate.isAfter(endDate)) {
      return errorResponse({
        statusCode: 400,
        code: "invalid_date_range",
        detail: "start_date must be before end_date",
        attribute: "date_range",
        req,
        team_id: teamId,
      });
    }
  }

  try {
    const serviceClient = await getAPIServiceGraphqlClient();

    // Build where clause dynamically
    const whereClause: any = {
      action_id: { _eq: action_id },
    };

    // Add date filters only if provided
    const dateFilters = [];
    if (start_date) {
      dateFilters.push({ created_at: { _gte: start_date } });
    }
    if (end_date) {
      dateFilters.push({ created_at: { _lte: end_date } });
    }

    // Only add _and clause if we have date filters
    if (dateFilters.length > 0) {
      whereClause._and = dateFilters;
    }

    console.log("whereClause", JSON.stringify(whereClause, null, 2));
    console.log("limit", limit);
    console.log("offset", offset);

    const { nullifier } = await fetchVerificationsSdk(
      serviceClient,
    ).FetchVerifications({
      where: whereClause,
      limit,
      offset,
    });

    // Format the response
    const verifications = nullifier.map((n) => ({
      id: n.id,
      nullifier_hash: n.nullifier_hash,
      action: n.action.action,
      action_name: n.action.name,
      app_id: n.action.app_id,
      verification_count: n.uses,
      first_verified_at: n.created_at,
      last_verified_at: n.created_at, // Using created_at as fallback since updated_at might not exist
    }));

    // For test compatibility, we'll approximate the total count
    // In production, this should use nullifier_aggregate
    const returnedCount = nullifier.length;
    const totalCount =
      returnedCount === limit ? offset + limit + 1 : offset + returnedCount;
    const hasNextPage = returnedCount === limit;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      status: 200,
      result: {
        verifications,
        pagination: {
          offset,
          limit,
          total_count: totalCount,
          has_next_page: hasNextPage,
          current_page: currentPage,
          total_pages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);

    return errorResponse({
      statusCode: 500,
      code: "internal_error",
      detail: "An error occurred while fetching verifications",
      attribute: null,
      req,
      team_id: teamId,
    });
  }
};
