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
        nullifier_hash: semaphoreProofParamsMock.nullifier_hash,
      })
    );
  });

  test("handles nullifier insertion", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Multi-claim App' limit 1;"
    );
    const app_id = appQuery.rows[0].id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`
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

    // Send both requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200
    );
    expect(successResponses.length).toBe(1);

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200
    );
    expect(errorResponses.length).toBe(4);
  });

  test("handles race conditions", async () => {
    const appQuery = await integrationDBExecuteQuery(
      "SELECT * FROM app where name = 'Multi-claim App' limit 1;"
    );
    const app_id = appQuery.rows[0].id;
    const actionQuery = await integrationDBExecuteQuery(
      `SELECT * FROM action where name = 'Multi-claim action' limit 1;`
    );
    const action = actionQuery.rows[0].action;
    console.log(action);

    const validRequestPayload = validParams(app_id, action);
    const { req, res } = createMocks({
      method: "POST",
      query: { app_id },
      body: validRequestPayload,
    });
    handleVerify(req, res);

    const requests = [1, 2, 3, 4, 5].map(() =>
      createMocks({
        method: "POST",
        query: { app_id },
        body: validRequestPayload,
      })
    );

    // Send both requests at the same time
    await Promise.all(requests.map(({ req, res }) => handleVerify(req, res)));

    // Only one of the requests should be successful
    const successResponses = requests.filter(
      ({ res }) => res._getStatusCode() === 200
    );
    expect(successResponses.length).toBe(1);

    const errorResponses = requests.filter(
      ({ res }) => res._getStatusCode() !== 200
    );
    expect(errorResponses.length).toBe(4);
    const nullifierHash = await integrationDBExecuteQuery(
      `SELECT uses FROM nullifier WHERE nullifier_hash = '${validRequestPayload.nullifier_hash}';`
    );
    expect(nullifierHash.rows[0].uses).toBe(1);
  });
});
