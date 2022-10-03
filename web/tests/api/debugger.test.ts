import fetchMock from "jest-fetch-mock";

beforeAll(() => {
  fetchMock.enableMocks();
});

// TODO: All relevant test cases
describe("/api/v1/debugger", () => {
  test("can verify production proof", async () => {});
  test("can verify staging proof", async () => {});
  test("invalid merkle root", async () => {});
  test("invalid proof", async () => {});
  test("improperly encoded action_id", async () => {});
  test("improperly encoded signal", async () => {});
  test("improperly formatted request", async () => {});
});
