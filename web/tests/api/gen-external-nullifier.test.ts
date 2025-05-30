import { POST } from "@/api/_gen-external-nullifier";
import { NextRequest } from "next/server";

const HASURA_EVENT_TRIGGER_PAYLOAD = {
  event: {
    session_variables: {
      "x-hasura-role": "admin",
    },
    op: "INSERT",
    data: {
      old: null,
      new: {
        is_staging: true,
        status: "created",
        team_id: "team_eb668f074687180cb00729c8cb9e3d23",
        engine: "cloud",
        hashed_id: "",
        crypto_chain: "",
        name: "My new action",
        updated_at: "2022-06-18T17:06:12.77282+00:00",
        created_at: "2022-06-18T17:06:12.77282+00:00",
        id: "wid_staging_f8f9f14036672d4132e0b14e8f256179",
        public_description: "",
        return_url: "",
        description: "",
      },
    },
    trace_context: {
      trace_id: "b201100f3de4c176",
      span_id: "28029f18f8dce615",
    },
  },
  created_at: "2022-06-18T17:06:12.77282Z",
  id: "9e0d1385-527f-4949-8b10-a7d1721bf0e6",
  delivery_info: {
    max_retries: 5,
    current_retry: 0,
  },
  trigger: {
    name: "generate_hash_action_id",
  },
  table: {
    schema: "public",
    name: "action",
  },
};

// FIXME
describe("/api/_gen-hashed-action-id", () => {
  test("generates hashed action ID upon action creation", async () => {});
  test("endpoint is only accessible with specific token (Hasura)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/_gen-external-nullifier",
      {
        method: "POST",
        body: JSON.stringify(HASURA_EVENT_TRIGGER_PAYLOAD),
      },
    );

    const response = await POST(request);

    expect(response?.status).toBe(403);
    expect(await response?.json()).toEqual({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attribute: null,
    });
  });
});
