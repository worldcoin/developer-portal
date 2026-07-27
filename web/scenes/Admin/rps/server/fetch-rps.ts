import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_RP_COLUMN_VISIBILITY,
  type RpColumnVisibility,
} from "@/components/AdminDashboard/RPs/column-visibility";
import {
  clampRpsPage,
  DEFAULT_RPS_LIMIT,
  DEFAULT_RPS_PAGE,
  getRpsOffset,
  getRpsTotalPages,
  type RpsLimit,
} from "@/components/AdminDashboard/RPs/pagination";
import {
  parseRpsSearchTokens,
  type ParsedRpsSearchToken,
  type RpsSearchOperator,
} from "@/components/AdminDashboard/RPs/search";
import {
  getEffectiveRpsSort,
  type RpsSort,
} from "@/components/AdminDashboard/RPs/sorting";
import type {
  RpRegistrationMode,
  RpStatus,
  RpTableRow,
} from "@/components/AdminDashboard/RPs/types";
import { parseDateSearchValue } from "@/components/AdminDashboard/common/search-tokens";
import {
  Order_By,
  type Rp_Registration_Bool_Exp,
  type Rp_Registration_Order_By,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";

import {
  FetchAdminRpsQuery,
  getSdk,
} from "../graphql/server/fetch-admin-rps.generated";
import {
  FetchAdminRpInventoryQuery,
  getSdk as getInventorySdk,
} from "../graphql/server/fetch-admin-rp-inventory.generated";

const RP_STATUSES = new Set<string>(Object.values(RpRegistrationStatus));
const RP_MODES = new Set<string>(["managed", "self_managed"]);

const noResultsWhere: Rp_Registration_Bool_Exp = { rp_id: { _in: [] } };
const OPERATION_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

const getStringPredicate = (operator: RpsSearchOperator, value: string) => {
  if (operator === "=") {
    return { _eq: value };
  }

  if (operator === "!=") {
    return { _nilike: `%${value}%` };
  }

  return { _ilike: `%${value}%` };
};

const getDatePredicate = (operator: RpsSearchOperator, value: string) => {
  const date = parseDateSearchValue(value);

  if (!date) {
    return null;
  }

  if (operator === ">") return { _gt: date };
  if (operator === ">=") return { _gte: date };
  if (operator === "<") return { _lt: date };
  if (operator === "<=") return { _lte: date };
  if (operator === "!=") return { _neq: date };
  return { _eq: date };
};

const createFieldWhere = (
  token: Extract<ParsedRpsSearchToken, { type: "field" }>,
): Rp_Registration_Bool_Exp | null => {
  if (token.field === "rp") {
    return { rp_id: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "app") {
    return { app_id: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "app_name") {
    return {
      app: { name: getStringPredicate(token.operator, token.value) },
    };
  }

  if (token.field === "team") {
    return {
      app: { team_id: getStringPredicate(token.operator, token.value) },
    };
  }

  if (token.field === "mode") {
    if (!RP_MODES.has(token.value)) {
      return noResultsWhere;
    }

    if (token.operator === "!=") {
      return { mode: { _neq: token.value } };
    }

    if (token.operator === ":" || token.operator === "=") {
      return { mode: { _eq: token.value } };
    }

    return noResultsWhere;
  }

  if (token.field === "status") {
    if (!RP_STATUSES.has(token.value)) {
      return noResultsWhere;
    }

    if (token.operator === "!=") {
      return { status: { _neq: token.value } };
    }

    if (token.operator === ":" || token.operator === "=") {
      return { status: { _eq: token.value } };
    }

    return noResultsWhere;
  }

  if (token.field === "staging_status") {
    if (token.value === "null") {
      if (token.operator === "!=") {
        return { staging_status: { _is_null: false } };
      }

      if (token.operator === ":" || token.operator === "=") {
        return { staging_status: { _is_null: true } };
      }

      return noResultsWhere;
    }

    if (!RP_STATUSES.has(token.value)) {
      return noResultsWhere;
    }

    if (token.operator === "!=") {
      return { staging_status: { _neq: token.value } };
    }

    if (token.operator === ":" || token.operator === "=") {
      return { staging_status: { _eq: token.value } };
    }

    return noResultsWhere;
  }

  if (token.field === "signer") {
    const predicate = getStringPredicate(token.operator, token.value);

    if (OPERATION_HASH_PATTERN.test(token.value)) {
      return {
        _or: [
          { signer_address: predicate },
          { operation_hash: predicate },
          { staging_operation_hash: predicate },
        ],
      };
    }

    return { signer_address: predicate };
  }

  if (token.field === "operation") {
    return { operation_hash: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "staging_operation") {
    return {
      staging_operation_hash: getStringPredicate(token.operator, token.value),
    };
  }

  if (token.field === "created") {
    const predicate = getDatePredicate(token.operator, token.value);
    return predicate ? { created_at: predicate } : noResultsWhere;
  }

  const predicate = getDatePredicate(token.operator, token.value);
  return predicate ? { updated_at: predicate } : noResultsWhere;
};

export const createRpsWhere = (
  searchQuery: string,
): Rp_Registration_Bool_Exp => {
  if (!searchQuery) return {};

  const expressions = parseRpsSearchTokens(searchQuery)
    .map((token): Rp_Registration_Bool_Exp | null =>
      token.type === "plain"
        ? {
            _or: [
              { rp_id: { _ilike: `%${token.value}%` } },
              { app_id: { _ilike: `%${token.value}%` } },
              { app: { name: { _ilike: `%${token.value}%` } } },
              { app: { team_id: { _ilike: `%${token.value}%` } } },
              { signer_address: { _ilike: `%${token.value}%` } },
              { operation_hash: { _ilike: `%${token.value}%` } },
              { staging_operation_hash: { _ilike: `%${token.value}%` } },
            ],
          }
        : createFieldWhere(token),
    )
    .filter((expression): expression is Rp_Registration_Bool_Exp =>
      Boolean(expression),
    );

  return expressions.length === 0
    ? {}
    : expressions.length === 1
      ? expressions[0]
      : { _and: expressions };
};

export const createRpsOrderBy = (
  sort: RpsSort | null,
): Rp_Registration_Order_By[] => {
  const effectiveSort = getEffectiveRpsSort(sort);
  const direction =
    effectiveSort.direction === "asc" ? Order_By.Asc : Order_By.Desc;

  if (effectiveSort.field === "appId") {
    return [{ app_id: direction }, { rp_id: Order_By.Asc }];
  }

  if (effectiveSort.field === "createdAt") {
    return [{ created_at: direction }, { rp_id: Order_By.Asc }];
  }

  if (effectiveSort.field === "mode") {
    return [{ mode: direction }, { rp_id: Order_By.Asc }];
  }

  if (effectiveSort.field === "status") {
    return [{ status: direction }, { rp_id: Order_By.Asc }];
  }

  if (effectiveSort.field === "updatedAt") {
    return [{ updated_at: direction }, { rp_id: Order_By.Asc }];
  }

  return [{ rp_id: direction }];
};

const mapRpToTableRow = (
  rp: FetchAdminRpsQuery["rp_registration"][number],
  columnVisibility: RpColumnVisibility,
): RpTableRow => ({
  appId: rp.app_id,
  appName: rp.app.name || "Unnamed app",
  createdAt:
    columnVisibility.createdAt && rp.created_at
      ? rp.created_at.slice(0, 10)
      : undefined,
  id: rp.rp_id,
  mode: rp.mode as RpRegistrationMode,
  operationHash: columnVisibility.operationHash
    ? rp.operation_hash ?? null
    : undefined,
  rpId: rp.rp_id,
  signerAddress: columnVisibility.signerAddress
    ? rp.signer_address ?? null
    : undefined,
  stagingOperationHash: columnVisibility.stagingOperationHash
    ? rp.staging_operation_hash ?? null
    : undefined,
  stagingStatus: (rp.staging_status as RpStatus | null) ?? null,
  status: rp.status as RpStatus,
  teamId: columnVisibility.teamId ? rp.app.team_id : undefined,
  updatedAt: rp.updated_at.slice(0, 10),
});

const toCount = (value: number | string | null | undefined): number => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
};

export type AdminRpInventory = {
  distinctManagerKeys: number;
  managedRps: number;
  managedWithKey: number;
  managedWithoutKey: number;
  rpsOnSharedKeys: number;
  selfManagedRps: number;
  sharedKeyGroups: number;
  stagingStatus: {
    deactivated: number;
    failed: number;
    null: number;
    pending: number;
    registered: number;
  };
  status: {
    deactivated: number;
    failed: number;
    pending: number;
    registered: number;
  };
  totalRps: number;
};

export const mapAdminRpInventory = (
  inventory: FetchAdminRpInventoryQuery["admin_rp_inventory"][number],
): AdminRpInventory => ({
  distinctManagerKeys: toCount(inventory.distinct_manager_keys),
  managedRps: toCount(inventory.managed_rps),
  managedWithKey: toCount(inventory.managed_with_key),
  managedWithoutKey: toCount(inventory.managed_without_key),
  rpsOnSharedKeys: toCount(inventory.rps_on_shared_keys),
  selfManagedRps: toCount(inventory.self_managed_rps),
  sharedKeyGroups: toCount(inventory.shared_key_groups),
  stagingStatus: {
    deactivated: toCount(inventory.staging_status_deactivated),
    failed: toCount(inventory.staging_status_failed),
    null: toCount(inventory.staging_status_null),
    pending: toCount(inventory.staging_status_pending),
    registered: toCount(inventory.staging_status_registered),
  },
  status: {
    deactivated: toCount(inventory.status_deactivated),
    failed: toCount(inventory.status_failed),
    pending: toCount(inventory.status_pending),
    registered: toCount(inventory.status_registered),
  },
  totalRps: toCount(inventory.total_rps),
});

type FetchAdminRpsOptions = {
  columnVisibility: RpColumnVisibility;
  limit: RpsLimit;
  page: number;
  searchQuery: string;
  sort: RpsSort | null;
};

export const fetchAdminRpsPage = async (
  { columnVisibility, limit, page, searchQuery, sort }: FetchAdminRpsOptions = {
    columnVisibility: DEFAULT_RP_COLUMN_VISIBILITY,
    limit: DEFAULT_RPS_LIMIT,
    page: DEFAULT_RPS_PAGE,
    searchQuery: "",
    sort: null,
  },
) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createRpsWhere(searchQuery);

  try {
    const [listData, inventoryData] = await Promise.all([
      getSdk(client).FetchAdminRps({
        includeCreatedAt: columnVisibility.createdAt,
        includeOperationHash: columnVisibility.operationHash,
        includeSignerAddress: columnVisibility.signerAddress,
        includeStagingOperationHash: columnVisibility.stagingOperationHash,
        includeTeamId: columnVisibility.teamId,
        limit,
        offset: getRpsOffset(page, limit),
        orderBy: createRpsOrderBy(sort),
        where,
      }),
      getInventorySdk(client).FetchAdminRpInventory(),
    ]);

    const inventoryRow = inventoryData.admin_rp_inventory[0];

    if (!inventoryRow) {
      throw new Error("admin_rp_inventory returned no rows");
    }

    const rps = listData.rp_registration.map((rp) =>
      mapRpToTableRow(rp, columnVisibility),
    );
    const rpsAmount =
      listData.rp_registration_aggregate.aggregate?.count ?? rps.length;
    const totalPages = getRpsTotalPages(rpsAmount, limit);

    return {
      currentPage: clampRpsPage(page, totalPages),
      inventory: mapAdminRpInventory(inventoryRow),
      rps,
      rpsAmount,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin RPs", { error });
    throw error;
  }
};
