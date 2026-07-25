jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn(),
}));

jest.mock(
  "@/scenes/Admin/rps/graphql/server/fetch-admin-rps.generated",
  () => ({
    getSdk: jest.fn(),
  }),
);

jest.mock(
  "@/scenes/Admin/rps/graphql/server/fetch-admin-rp-inventory.generated",
  () => ({
    getSdk: jest.fn(),
  }),
);

import { getRpsSearchVisualSegments } from "@/components/AdminDashboard/RPs/search";
import {
  getNextRpsSort,
  SORTABLE_RP_COLUMN_IDS,
} from "@/components/AdminDashboard/RPs/sorting";
import { columns } from "@/components/AdminDashboard/RPs/columns";
import { Order_By } from "@/graphql/graphql";
import {
  createRpsOrderBy,
  createRpsWhere,
  mapAdminRpInventory,
} from "@/scenes/Admin/rps/server/fetch-rps";

describe("admin RPs query mapping", () => {
  it("searches plain terms across RP identity, signer, and operation hashes", () => {
    expect(createRpsWhere("wallet")).toEqual({
      _or: [
        { rp_id: { _ilike: "%wallet%" } },
        { app_id: { _ilike: "%wallet%" } },
        { app: { name: { _ilike: "%wallet%" } } },
        { app: { team_id: { _ilike: "%wallet%" } } },
        { signer_address: { _ilike: "%wallet%" } },
        { operation_hash: { _ilike: "%wallet%" } },
        { staging_operation_hash: { _ilike: "%wallet%" } },
      ],
    });
  });

  it("merges incomplete field chips with a following pasted value", () => {
    const stagingHash =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb90";

    expect(createRpsWhere(`signer: ${stagingHash}`)).toEqual({
      _or: [
        { signer_address: { _ilike: `%${stagingHash}%` } },
        { operation_hash: { _ilike: `%${stagingHash}%` } },
        { staging_operation_hash: { _ilike: `%${stagingHash}%` } },
      ],
    });
    expect(createRpsWhere(`staging_operation: ${stagingHash}`)).toEqual({
      staging_operation_hash: { _ilike: `%${stagingHash}%` },
    });
  });

  it("filters by signer address without broadening to operation hashes", () => {
    expect(
      createRpsWhere("signer:0x0000000000000000000000000000000000000090"),
    ).toEqual({
      signer_address: {
        _ilike: "%0x0000000000000000000000000000000000000090%",
      },
    });
  });

  it("filters by mode and status enums", () => {
    expect(createRpsWhere("mode:managed")).toEqual({
      mode: { _eq: "managed" },
    });
    expect(createRpsWhere("status:registered")).toEqual({
      status: { _eq: "registered" },
    });
    expect(createRpsWhere("mode:unknown")).toEqual({ rp_id: { _in: [] } });
    expect(createRpsWhere("status:bogus")).toEqual({ rp_id: { _in: [] } });
  });

  it("applies inequality operators to mode and status enums", () => {
    expect(createRpsWhere("mode!=managed")).toEqual({
      mode: { _neq: "managed" },
    });
    expect(createRpsWhere("status!=registered")).toEqual({
      status: { _neq: "registered" },
    });
    expect(createRpsWhere("staging_status!=pending")).toEqual({
      staging_status: { _neq: "pending" },
    });
    expect(createRpsWhere("mode>managed")).toEqual({ rp_id: { _in: [] } });
  });

  it("filters unset staging status and rejects invalid values", () => {
    expect(createRpsWhere("staging_status:null")).toEqual({
      staging_status: { _is_null: true },
    });
    expect(createRpsWhere("staging_status!=null")).toEqual({
      staging_status: { _is_null: false },
    });
    expect(createRpsWhere("staging_status:pending")).toEqual({
      staging_status: { _eq: "pending" },
    });
    expect(createRpsWhere("staging_status:bogus")).toEqual({
      rp_id: { _in: [] },
    });
  });

  it("uses a unique final sort key for update date", () => {
    expect(createRpsOrderBy({ field: "updatedAt", direction: "desc" })).toEqual(
      [{ updated_at: Order_By.Desc }, { rp_id: Order_By.Asc }],
    );
  });

  it("orders by app id when the App column is sorted", () => {
    expect(createRpsOrderBy({ field: "appId", direction: "asc" })).toEqual([
      { app_id: Order_By.Asc },
      { rp_id: Order_By.Asc },
    ]);
  });

  it("aligns the App column id with the sortable appId field", () => {
    expect(columns.some((column) => column.id === "appId")).toBe(true);
    expect(SORTABLE_RP_COLUMN_IDS).toContain("appId");
  });

  it("toggles the default Updated sort to ascending on the first click", () => {
    expect(getNextRpsSort(null, "updatedAt")).toEqual({
      direction: "asc",
      field: "updatedAt",
    });
    expect(
      getNextRpsSort({ direction: "asc", field: "updatedAt" }, "updatedAt"),
    ).toBeNull();
  });

  it("returns no matches for an invalid date filter", () => {
    expect(createRpsWhere("created>=invalid")).toEqual({ rp_id: { _in: [] } });
  });

  it("preserves text before, between, and after field chips", () => {
    expect(
      getRpsSearchVisualSegments("test mode:managed status:failed trailing"),
    ).toEqual([
      { type: "text", value: "test " },
      { type: "chip", value: "mode:managed" },
      { type: "text", value: " " },
      { type: "chip", value: "status:failed" },
      { type: "text", value: " trailing" },
    ]);
  });

  it("renders incomplete field chips with a pasted value as one chip", () => {
    expect(
      getRpsSearchVisualSegments(
        "signer: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb90",
      ),
    ).toEqual([
      {
        type: "chip",
        value:
          "signer: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb90",
      },
    ]);
  });

  it("maps inventory aggregate counts without exposing key identifiers", () => {
    expect(
      mapAdminRpInventory({
        distinct_manager_keys: 3,
        managed_rps: 10,
        managed_with_key: 8,
        managed_without_key: 2,
        rps_on_shared_keys: 4,
        self_managed_rps: 5,
        shared_key_groups: 1,
        staging_status_deactivated: 0,
        staging_status_failed: 1,
        staging_status_null: 6,
        staging_status_pending: 2,
        staging_status_registered: 6,
        status_deactivated: 1,
        status_failed: 2,
        status_pending: 3,
        status_registered: 9,
        total_rps: 15,
      }),
    ).toEqual({
      distinctManagerKeys: 3,
      managedRps: 10,
      managedWithKey: 8,
      managedWithoutKey: 2,
      rpsOnSharedKeys: 4,
      selfManagedRps: 5,
      sharedKeyGroups: 1,
      stagingStatus: {
        deactivated: 0,
        failed: 1,
        null: 6,
        pending: 2,
        registered: 6,
      },
      status: {
        deactivated: 1,
        failed: 2,
        pending: 3,
        registered: 9,
      },
      totalRps: 15,
    });
  });
});
