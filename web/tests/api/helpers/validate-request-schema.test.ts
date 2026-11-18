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
    "strips undeclared %s like other unknown fields",
    async (key) => {
      const value = JSON.parse(JSON.stringify({ count: "2", [key]: {} }));
      const result = await validateRequestSchema({
        schema: yup.object({ count: yup.number().required() }).noUnknown(),
        value,
      });

      expect(result).toEqual({ isValid: true, parsedParams: { count: 2 } });
      expect(logger.error).not.toHaveBeenCalled();
      expect(Object.hasOwn(value, key)).toBe(true);
    },
  );

  it.each(Object.getOwnPropertyNames(Object.prototype))(
    "preserves undeclared %s when the schema allows unknown fields",
    async (key) => {
      const value = JSON.parse(JSON.stringify({ count: "2", [key]: {} }));
      const result = await validateRequestSchema({
        schema: yup.object({ count: yup.number().required() }),
        value,
      });

      expect(result.isValid).toBe(true);
      if (!result.isValid) throw new Error("Expected successful validation");
      expect(result.parsedParams).toEqual({ count: 2, [key]: {} });
      expect(Object.hasOwn(result.parsedParams, key)).toBe(true);
      expect(Object.getPrototypeOf(result.parsedParams)).toBe(Object.prototype);
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it.each(["constructor", "toString"])(
    "uses an explicitly declared %s validator",
    async (key) => {
      const schema = yup.object({ [key]: yup.number().required() }).noUnknown();
      const result = await validateRequestSchema({
        schema,
        value: { [key]: "2" },
      });
      expect(result).toEqual({ isValid: true, parsedParams: { [key]: 2 } });

      const invalid = await validateRequestSchema({
        schema,
        value: { [key]: "invalid" },
      });
      if (invalid.isValid) throw new Error("Expected validation rejection");
      const response = invalid.handleError(request());
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: "validation_error",
        attribute: key,
      });
    },
  );

  it("preserves strict unknown-field rejection", async () => {
    const result = await validateRequestSchema({
      schema: yup.object({ name: yup.string() }).noUnknown().strict(),
      value: { name: "Ada", constructor: {} },
    });

    if (result.isValid) throw new Error("Expected validation rejection");
    const response = result.handleError(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "validation_error",
      detail: "this field has unspecified keys: constructor",
    });
  });

  it("strips unknown fields in nested objects and arrays", async () => {
    const result = await validateRequestSchema({
      schema: yup.object({
        profile: yup.object({ label: yup.string().default("Ada") }).noUnknown(),
        items: yup.array().of(yup.object({ count: yup.number() }).noUnknown()),
      }),
      value: JSON.parse(
        '{"profile":{"toString":"value"},"items":[{"constructor":{},"__proto__":{},"count":"2"}]}',
      ),
    });

    expect(result).toEqual({
      isValid: true,
      parsedParams: { profile: { label: "Ada" }, items: [{ count: 2 }] },
    });
  });

  it("keeps an unknown __proto__ object as data without inheriting its fields", async () => {
    const result = await validateRequestSchema({
      schema: yup.object({ count: yup.number().default(2) }),
      value: JSON.parse('{"__proto__":{"admin":true}}'),
    });

    if (!result.isValid) throw new Error("Expected successful validation");
    expect(result.parsedParams).toEqual({
      count: 2,
      ["__proto__"]: { admin: true },
    });
    expect(Object.hasOwn(result.parsedParams, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(result.parsedParams)).toBe(Object.prototype);
    expect("admin" in result.parsedParams).toBe(false);
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
