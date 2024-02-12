import { createMocks } from "node-mocks-http";
import handleContracts from "@/pages/api/v1/contracts";
import { NextApiRequest, NextApiResponse } from "next";

const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();

jest.mock(
  "legacy/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  })),
);

describe("/api/v1/contracts", () => {
  test("can obtain semaphore contracts", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
    expect(res._getJSONData()).toEqual([
      { key: "id.worldcoin.eth", value: "0x0000000000000000000000000000" },
    ]);
  });
});
