import { createMocks } from "node-mocks-http";
import handleContracts from "src/pages/api/v1/contracts";

// FIXME
describe("/api/v1/contracts", () => {
  test("can obtain semaphore contracts", async () => {
    const { req, res } = createMocks({
      method: "POST",
    });

    await handleContracts(req, res);
  });
});
