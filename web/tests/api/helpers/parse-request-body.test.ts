import { parseRequestBody } from "@/api/helpers/parse-request-body";
import { NextRequest } from "next/server";

jest.mock(
  "@/lib/logger",
  () => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  }),
  { virtual: true },
);

const buildRequest = (body: BodyInit | null) =>
  new NextRequest("http://localhost/api/test", {
    method: "POST",
    body,
  });

describe("parseRequestBody", () => {
  it("returns the parsed body for valid JSON", async () => {
    const req = buildRequest(JSON.stringify({ foo: "bar", n: 1 }));

    const result = await parseRequestBody<{ foo: string; n: number }>(req);

    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.body).toEqual({ foo: "bar", n: 1 });
    }
  });

  it("returns a 400 invalid_json response for an empty body", async () => {
    const req = buildRequest(null);

    const result = await parseRequestBody(req);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json).toMatchObject({
        code: "invalid_json",
        detail: "Request body must be valid JSON.",
        attribute: null,
      });
    }
  });

  it("returns a 400 invalid_json response for malformed JSON", async () => {
    const req = buildRequest("{ not: valid json");

    const result = await parseRequestBody(req);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json.code).toBe("invalid_json");
    }
  });

  it("includes app_id in the error response when provided", async () => {
    const req = buildRequest("");

    const result = await parseRequestBody(req, { app_id: "app_abc" });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const json = await result.error.json();
      expect(json.app_id).toBe("app_abc");
    }
  });
});
