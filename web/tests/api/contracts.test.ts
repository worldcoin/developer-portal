import { createMocks } from "node-mocks-http";
import handleContracts from "src/pages/api/v1/contracts";

// TODO
describe("/api/v1/contracts", () => {
  test("can obtain semaphore contracts", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handleContracts(req, res);
    expect(res._getStatusCode()).toBe(200);
  });
});
