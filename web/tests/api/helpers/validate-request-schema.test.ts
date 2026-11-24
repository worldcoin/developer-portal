import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import * as yup from "yup";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
// #endregion

const request = () => new NextRequest("http://localhost/api/test");

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Property-name validation
describe("validateRequestSchema", () => {
  it.each(Object.getOwnPropertyNames(Object.prototype))(
    "rejects the inherited schema-field name %s with a field-specific 400",
    async (key) => {
      const value = JSON.parse(JSON.stringify({ name: "Ada", [key]: {} }));
      const result = await validateRequestSchema({
        schema: yup.object({ name: yup.string().required() }).noUnknown(),
        value,
        app_id: "app_0123456789abcdef0123456789abcdef",
      });

      expect(result.isValid).toBe(false);
      if (result.isValid) throw new Error("Expected validation rejection");
      const response = result.handleError(request());
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        code: "validation_error",
        detail: "This attribute name is not supported.",
        attribute: key,
        app_id: "app_0123456789abcdef0123456789abcdef",
      });
      expect(logger.error).not.toHaveBeenCalled();
      expect(Object.hasOwn(value, key)).toBe(true);
    },
  );

  it.each([
    { value: { profile: { toString: "value" } }, path: "profile.toString" },
    {
      value: { items: [{ constructor: "value" }] },
      path: "items[0].constructor",
    },
  ])("rejects nested property $path", async ({ value, path }) => {
    const result = await validateRequestSchema({
      schema: yup.object({
        profile: yup.object({ label: yup.string() }),
        items: yup.array().of(yup.object({ label: yup.string() })),
      }),
      value,
    });

    expect(result.isValid).toBe(false);
    if (result.isValid) throw new Error("Expected validation rejection");
    const response = result.handleError(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      attribute: path,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("preserves casts, defaults, ordinary unknown-key stripping and property names as values", async () => {
    const result = await validateRequestSchema({
      schema: yup
        .object({
          count: yup.number(),
          label: yup.string().default("constructor"),
          note: yup.string().nullable(),
        })
        .noUnknown(),
      value: { count: "2", note: null, extra: "stripped" },
    });

    expect(result).toEqual({
      isValid: true,
      parsedParams: { count: 2, label: "constructor", note: null },
    });
  });

  it("preserves ordinary required-field validation", async () => {
    const result = await validateRequestSchema({
      schema: yup.object({ name: yup.string().required("Name is required.") }),
      value: {},
    });

    if (result.isValid) throw new Error("Expected validation rejection");
    const response = result.handleError(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      detail: "Name is required.",
      attribute: "name",
    });
  });

  it("preserves 500 responses and telemetry for unexpected schema errors", async () => {
    const result = await validateRequestSchema({
      schema: yup.string().transform(() => {
        throw new TypeError("Unexpected transform failure");
      }),
      value: "test",
    });

    if (result.isValid) throw new Error("Expected schema failure");
    const response = result.handleError(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ code: "server_error" });
    expect(logger.error).toHaveBeenCalledWith(
      "Unexpected error validating request schema",
      expect.objectContaining({ error: "Unexpected transform failure" }),
    );
  });
});
// #endregion
