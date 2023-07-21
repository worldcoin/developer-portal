import { createMocks } from "node-mocks-http";
import handleContracts from "src/pages/api/v1/contracts";

const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  }))
);

describe("/api/v1/contracts", () => {
  test("can obtain semaphore contracts", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    requestReturnFn.mockResolvedValue({
      data: {
        cache: [
          { key: "id.worldcoin.eth", value: "0x0000000000000000000000000000" },
        ],
      },
    });

    await handleContracts(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
