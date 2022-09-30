import { createMocks } from "node-mocks-http";
import handleENS from "pages/api/_ens";

// FIXME
describe("/api/_ens", () => {
  test("fetch ENS records and store them", async () => {});
  test("does not overwrite if ENS records are not obtained", async () => {});
  test("endpoint is only accessible with specific token (Hasura)", async () => {
    const { req, res } = createMocks({
      method: "POST",
    });

    await handleENS(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toEqual({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attr: null,
    });
  });
});
