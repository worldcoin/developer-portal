import { generateHashedSecret } from "@/api/helpers/utils";
import { POST } from "@/api/v2/create-action";
import { generateExternalNullifier } from "@/lib/hashing";
import { NextRequest } from "next/server";
import { integrationDBClean, integrationDBExecuteQuery } from "../../setup";

// #region Mocks
jest.mock("../../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

beforeEach(integrationDBClean);

// #region Server-controlled action creation
describe("/api/v2/create-action [integration]", () => {
  it("creates an action with a server-derived nullifier despite a caller-supplied value", async () => {
    const { rows: apps } = await integrationDBExecuteQuery(
      "SELECT id, team_id FROM app WHERE deleted_at IS NULL AND is_archived = false AND is_staging = true LIMIT 1",
    );
    const app = apps[0];
    const keyId = "key_0123456789abcdef0123456789abcdef";
    const { secret, hashed_secret } = generateHashedSecret(keyId);
    await integrationDBExecuteQuery(
      "INSERT INTO api_key (id, team_id, api_key, name, is_active) VALUES ($1, $2, $3, $4, true)",
      [keyId, app.team_id, hashed_secret, "Create action test"],
    );

    const action = "server-derived-action";
    const callerNullifier = "0x1234";
    const request = new NextRequest(
      `http://localhost:3000/api/v2/create-action/${app.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer api_${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
        },
        body: JSON.stringify({
          action,
          max_verifications: 0,
          external_nullifier: callerNullifier,
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ app_id: app.id }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    const expectedNullifier = generateExternalNullifier(app.id, action).digest;
    expect(body.action).toEqual(
      expect.objectContaining({
        action,
        max_verifications: 0,
        external_nullifier: expectedNullifier,
      }),
    );

    const { rows } = await integrationDBExecuteQuery(
      "SELECT app_id, external_nullifier FROM action WHERE id = $1",
      [body.action.id],
    );
    expect(rows).toEqual([
      { app_id: app.id, external_nullifier: expectedNullifier },
    ]);
    expect(rows[0].external_nullifier).not.toBe(callerNullifier);
  });
});
// #endregion
