import { createMocks } from "node-mocks-http";
import handleVerify from "@/pages/api/v1/verify/[app_id]";
import { semaphoreProofParamsMock } from "tests/api/__mocks__/proof.mock";
import {
  integrationDBSetup,
  integrationDBTearDown,
  integrationDBExecuteQuery,
} from "./setup";
import { IInputParams, IVerifyParams } from "@/legacy/backend/verify";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { NextApiRequest, NextApiResponse } from "next";

beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

jest.mock(
  "legacy/backend/verify",
  jest.fn(() => {
    const originalModule = jest.requireActual("legacy/backend/verify");
    return {
      ...originalModule,
      verifyProof: (proofParams: IInputParams, verifyParams: IVerifyParams) =>
        Promise.resolve({
          success: true,
          status: "on-chain",
        }),
    };
  }),
);

const validParams = (app_id: string, action: string) =>
  ({
    // proof verification is mocked
    ...semaphoreProofParamsMock,
    app_id: app_id,
    action: action,
  }) as Record<string, string>;

describe("/api/v1/verify/[app_id]", () => {
  test("can verify a valid request", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Multi-claim App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`,
    );
    const action = actionQuery.rows[0].action;

    // TODO: Replace with actual request payload
    const validRequestPayload = validParams(app_id, action);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        action,
        uses: 1,
        max_uses: 2,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
        verification_level: "orb",
      }),
    );
  });

  test("can verify for VerificationLevel.Device", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Multi-claim App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`,
    );
    const action = actionQuery.rows[0].action;

    const validRequestPayload = {
      ...validParams(app_id, action),
      verification_level: "device",
    };

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        action,
        uses: 1,
        max_uses: 2,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
        verification_level: VerificationLevel.Device,
      }),
    );
  });

  test("legacy credential_type is still supported", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Multi-claim App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`,
    );
    const action = actionQuery.rows[0].action;

    const validRequestPayload = {
      ...validParams(app_id, action),
      credential_type: "orb",
    };

    // @ts-ignore
    delete validRequestPayload.verification_level;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        action,
        uses: 1,
        max_uses: 2,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
        verification_level: "orb",
      }),
    );
  });

  test("handles nullifier insertion", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Custom Action App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Custom Action 1' limit 1;`,
    );
    const action = actionQuery.rows[0].action;

    const validRequestPayload = validParams(app_id, action);

    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      }),
    );

    // Send all requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200,
    );
    expect(successResponses.length).toBe(1);

    const successResponse = successResponses[0].res._getJSONData();
    expect(successResponse).toEqual(
      expect.objectContaining({
        action,
        uses: 1,
        max_uses: 1,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
      }),
    );

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200,
    );
    expect(errorResponses.length).toBe(4);

    const nullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`,
    );
    expect(nullifierHash.rows[0].uses).toBe(1);
  });

  test("handles race conditions", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Multi-claim App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`,
    );
    expect(actionQuery.rows[0].max_verifications).toBe(2); // Sanity check
    const action = actionQuery.rows[0].action;

    const validRequestPayload = validParams(app_id, action);
    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      }),
    );

    // Send all requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful (this test action allows two uses)
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200,
    );
    expect(successResponses.length).toBe(1); // Even though the app allows two, to prevent race conditions, only 1 is allowed at a time

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200,
    );
    expect(errorResponses.length).toBe(4);
    const nullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`,
    );
    expect(nullifierHash.rows[0].uses).toBe(1);

    // As a separate request, another one is allowed
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });
    await handleVerify(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        action,
        uses: 2,
        max_uses: 2,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x0447c1b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f00cf616",
      }),
    );
    const nullifierQuery = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`,
    );
    expect(nullifierQuery.rows[0].uses).toBe(2);
  });

  test("handles race conditions with multiple insertions", async () => {
    // This test case covers the case of the nullifier record being inserted first and then being updated
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app JOIN app_metadata ON app.id = app_metadata.app_id WHERE app_metadata.name = 'Multi-claim App' LIMIT 1;",
    );
    const app_id = appQuery.rows[0].app_id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`,
    );
    expect(actionQuery.rows[0].max_verifications).toBe(2); // Sanity check
    const action = actionQuery.rows[0].action;

    const validRequestPayload = validParams(app_id, action);
    validRequestPayload.nullifier_hash =
      "0x011111b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f0011111";

    // User verifies for the first time
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });
    await handleVerify(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        action,
        uses: 1,
        max_uses: 2,
        success: true,
        created_at: expect.any(String),
        nullifier_hash:
          "0x011111b95a5a808a36d3966216404ff4d522f1e66ecddf9c22439393f0011111",
      }),
    );

    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      }),
    );

    // Send all requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful (this test action allows two uses)
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200,
    );
    expect(successResponses.length).toBe(1); // Only one is allowed to reach the maximum of 2 verifications
    expect(successResponses[0].res._getJSONData()).toEqual(
      expect.objectContaining({ max_uses: 2, uses: 2 }),
    );

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200,
    );
    expect(errorResponses.length).toBe(4);
    const updatedNullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`,
    );
    expect(updatedNullifierHash.rows[0].uses).toBe(2);
  });
});

