import { createMocks } from "node-mocks-http";
import handleVerify from "src/pages/api/v1/verify/[app_id]";
import * as jose from "jose";
import { generateJWK } from "src/backend/jwts";
import fetchMock from "jest-fetch-mock";
import { when } from "jest-when";
import { NullifierModel } from "src/lib/models";

const validPayload = {
  merkle_root:
    "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
  nullifier_hash:
    "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
  proof:
    "0x11b4f021bd8c4d11a5ff1edda919ab825aa377c6922f7f3f5471a624e07f38250692d8414be3e25c3070f164de38069a8d069c94db31fd143eb3507d04487d4203565989a58f63d5b45f973beeb6e19d7c8de14e7f024b8881aacb4eddcd4b4716a2bcb5e732c1e362a6a243248c7b35d6aacead7bcd4c96f9aa36217ef1cbf92434db66fd35b0dac7cda875861d474867871aff8f465c0e55605f529e64c72805ce10171cf645d6ffdfa5507f51a87d9edefddca1acc5741e03bae83306ca31239dfffeaa8f91d2b6749899f377eb4f3e5db557ede16faa7e619d248cd388e814b0673c831201be0fffd84781842692ae9c4ef71c0f9dcd16f496c829055246",
  credential_type: "orb",
  action: "verify",
  signal: "",
};

const requestReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
    }),
  }))
);

beforeAll(() => {
  fetchMock.enableMocks();
});

const sampleENSActionQueryResponse = () => ({
  data: {
    cache: [
      {
        key: "semaphore.wld.eth",
        value: "0x1234567890",
      },
      {
        key: "staging.semaphore.wld.eth",
        value: "0x9876543210",
      },
    ],
    app: [
      {
        id: "app_staging_112233445566778",
        is_staging: true,
        engine: "cloud",
        actions: [
          {
            id: "action_staging_112233445566778",
            action: "verify",
            max_verifications: 1,
            external_nullifier:
              "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
            nullifiers: [] as Pick<NullifierModel, "nullifier_hash">[],
          },
        ],
      },
    ],
  },
});

// TODO: Finish these test cases
describe("/api/v1/verify", () => {
  test("can verify proof", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    requestReturnFn.mockResolvedValue(sampleENSActionQueryResponse());

    // mocks Alchemy response
    fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));

    await handleVerify(req, res);

    // TODO: mock nullifier insert

    console.log(res._getJSONData());

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        succes: true,
        nullifier_hash:
          "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
        action: "verify",
      })
    );
  });
  test("can verify staging proof", async () => {});
  test("return URL contains a verification JWT", async () => {
    //   // Set mock data & requests
    //   const { req, res } = createMocks({
    //     method: "POST",
    //     body: { ...validPayload },
    //   });
    //   const jwk = await generateJWK("PS256");
    //   when(requestReturnFn)
    //     .calledWith(
    //       expect.objectContaining({
    //         variables: expect.objectContaining({
    //           merkle_root: validPayload.merkle_root,
    //         }),
    //       })
    //     )
    //     .mockResolvedValue({
    //       data: {
    //         insert_nullifier_one: {
    //           nullifier_hash: validPayload.nullifier_hash,
    //           created_at: new Date().toISOString(),
    //         },
    //       },
    //     })
    //     .calledWith(expect.anything())
    //     .mockResolvedValue(
    //       sampleENSActionQueryResponse(
    //         jwk.privateJwk,
    //         "http://myapp.wld.eth/returned"
    //       )
    //     );
    //   fetchMock.mockResponseOnce(JSON.stringify({ result: "0x" }));
    //   await handleVerify(req, res);
    //   expect(res._getStatusCode()).toBe(200);
    //   expect(res._getJSONData()).toEqual(
    //     expect.objectContaining({
    //       success: true,
    //       nullifier_hash: validPayload.nullifier_hash,
    //     })
    //   );
    //   const return_url = new URL(res._getJSONData()["return_url"]);
    //   expect(return_url.host).toEqual("myapp.wld.eth");
    //   expect(return_url.searchParams.get("success")).toEqual("true");
    //   const token = return_url.searchParams.get("verification_jwt");
    //   if (!token) {
    //     throw new Error("Expected `token` to be set.");
    //   }
    //   const { payload } = await jose.jwtVerify(
    //     token,
    //     await jose.importJWK(jwk.publicJwk, "PS256"),
    //     {
    //       issuer: "https://developer.worldcoin.org",
    //     }
    //   );
    //   const decodedToken = payload as Record<string, any>;
    //   expect(decodedToken.signal).toEqual(validPayload.signal);
    //   expect(decodedToken.nullifier_hash).toEqual(validPayload.nullifier_hash);
    //   expect(decodedToken.verified).toEqual(true);
    //   expect(decodedToken.iss).toEqual("https://developer.worldcoin.org");
    //   expect(decodedToken.jti).toMatch(
    //     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    //   );
    //   const tokenDuration = decodedToken.exp - new Date().getTime() / 1000;
    //   expect(Math.abs(3600 - tokenDuration)).toBeLessThanOrEqual(2); // 1 hour (+/- 2 second tolerance)
  });
});

describe("/api/verify [error cases]", () => {
  test("action inactive or not found", async () => {});
  test("on-chain actions cannot be verified", async () => {});
  test("prevent duplicates (uniqueness check)", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    const precheckResponse = sampleENSActionQueryResponse();
    precheckResponse.data.app[0].actions[0].nullifiers = [
      { nullifier_hash: "nil_123" },
    ];
    requestReturnFn.mockResolvedValue(precheckResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "already_verified",
        detail: "This person has already verified for this action.",
      })
    );
  });

  test("cannot verify if reached max number of verifications", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...validPayload },
      query: { app_id: "app_staging_112233445566778" },
    });

    const precheckResponse = sampleENSActionQueryResponse();
    precheckResponse.data.app[0].actions[0].nullifiers = [
      { nullifier_hash: "nil_123" },
      { nullifier_hash: "nil_123" },
    ];
    precheckResponse.data.app[0].actions[0].max_verifications = 2;
    requestReturnFn.mockResolvedValue(precheckResponse);

    await handleVerify(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        code: "already_verified",
        detail:
          "This person has already verified for this action the maximum number of times (2).",
      })
    );
  });
  test("cannot verify without required parameters", async () => {});
  test("parameter parsing error", async () => {});
  test("invalid merkle root", async () => {});
  test("invalid proof", async () => {});
});
