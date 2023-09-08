import { createMocks } from "node-mocks-http";
import handleVerify from "src/pages/api/v1/verify/[app_id]";
import { semaphoreProofParamsMock } from "tests/api/__mocks__/proof.mock";
import {
  integrationDBSetup,
  integrationDBTearDown,
  integrationDBExecuteQuery,
} from "./setup";
import { IInputParams, IVerifyParams } from "src/backend/verify";

beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

jest.mock(
  "src/backend/verify",
  jest.fn(() => {
    const originalModule = jest.requireActual("src/backend/verify");
    return {
      ...originalModule,
      verifyProof: (proofParams: IInputParams, verifyParams: IVerifyParams) =>
        Promise.resolve({
          success: true,
          status: "on-chain",
        }),
    };
  })
);

const validParams = (app_id: string, action: string) =>
  ({
    // proof verification is mocked
    ...semaphoreProofParamsMock,
    app_id: app_id,
    action: action,
  } as Record<string, string>);

describe("/api/v1/verify/[app_id]", () => {
  test("can verify a valid request", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Multi-claim App' limit 1;"
    );
    const app_id = appQuery.rows[0].id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`
    );
    const action = actionQuery.rows[0].action;

    // TODO: Replace with actual request payload
    const validRequestPayload = validParams(app_id, action);

    const { req, res } = createMocks({
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
      })
    );
  });

  test("handles nullifier insertion", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Custom Action App' limit 1;"
    );
    const app_id = appQuery.rows[0].id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Custom Action 1' limit 1;`
    );
    const action = actionQuery.rows[0].action;

    const validRequestPayload = validParams(app_id, action);

    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      })
    );

    // Send all requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200
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
      })
    );

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200
    );
    expect(errorResponses.length).toBe(4);

    const nullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`
    );
    expect(nullifierHash.rows[0].uses).toBe(1);
  });

  test("handles race conditions", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Multi-claim App' limit 1;"
    );
    const app_id = appQuery.rows[0].id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`
    );
    expect(actionQuery.rows[0].max_verifications).toBe(2); // Sanity check
    const action = actionQuery.rows[0].action;

    const validRequestPayload = validParams(app_id, action);
    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      })
    );

    // Send both requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful (this test action allows two uses)
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200
    );
    expect(successResponses.length).toBe(1); // Even though the app allows two, to prevent race conditions, only 1 is allowed at a time

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200
    );
    expect(errorResponses.length).toBe(4);
    const nullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`
    );
    expect(nullifierHash.rows[0].uses).toBe(1);

    // As a separate request, another one is allowed
    const { req, res } = createMocks({
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
      })
    );
    const nullifierQuery = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`
    );
    expect(nullifierQuery.rows[0].uses).toBe(2);
  });
});
