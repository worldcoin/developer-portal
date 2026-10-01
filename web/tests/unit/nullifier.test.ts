import { nullifierSchema } from "@/api/helpers/nullifier-schema";
import { Nullifier } from "@/lib/nullifier";
import * as yup from "yup";

// #region Test Data
// Same field boundary as worldcoin/idkit#339's shared nullifier vectors.
const modulus =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const schema = yup.object({ nullifier: nullifierSchema.required() });
// #endregion

// #region Checked numeric values and JSON boundaries
describe("Nullifier", () => {
  it.each([
    ["0x01a", 26n],
    ["0x1a", 26n],
    ["0x1A", 26n],
    ["0X1a", 26n],
    ["1a", 26n],
    ["10", 16n],
    ["0", 0n],
    ["0x0", 0n],
    [`0x${"0".repeat(64)}`, 0n],
    [`0x${(modulus - 1n).toString(16)}`, modulus - 1n],
    [`0X${(modulus - 1n).toString(16).toUpperCase()}`, modulus - 1n],
    ["0x20000000000001", 9007199254740993n],
  ] as const)("parses %s exactly", (input, expected) => {
    const value = Nullifier.fromHex(input);
    const hex = `0x${expected.toString(16).padStart(64, "0")}`;
    expect(value.toBigInt()).toBe(expected);
    expect(value.toHex()).toBe(hex);
    expect(JSON.stringify({ nullifier: value })).toBe(
      JSON.stringify({ nullifier: hex }),
    );
    expect(Object.keys(value)).toEqual([]);
  });

  it.each([
    "",
    "0x",
    "0X",
    " 0x1",
    "0x1 ",
    "\t1",
    "-1",
    "+1",
    "0xg",
    "0x0x1",
    "0x-1",
    `0x${modulus.toString(16)}`,
    `0x${(modulus + 1n).toString(16)}`,
    `0x${"f".repeat(64)}`,
    `0x${"0".repeat(65)}`,
    "1".repeat(65),
    "0x1\n",
    "1\r",
    "１",
    `nil_${"0".repeat(64)}`,
  ])("rejects invalid or out-of-field hex %j", (input) => {
    expect(() => Nullifier.fromHex(input)).toThrow(RangeError);
    expect(() => schema.validateSync({ nullifier: input })).toThrow(
      yup.ValidationError,
    );
  });

  it.each([null, undefined, 26, 26n, {}, ["1a"]])(
    "rejects non-string input %p without coercion",
    (input) => {
      // @ts-expect-error JSON callers can bypass the TypeScript input type.
      expect(() => Nullifier.fromHex(input)).toThrow(TypeError);
      expect(() => schema.validateSync({ nullifier: input })).toThrow(
        yup.ValidationError,
      );
    },
  );

  it("parses the request once at the schema boundary", () => {
    const fromHex = jest.spyOn(Nullifier, "fromHex");
    try {
      const parsed = schema.validateSync({ nullifier: "10" });
      expect(parsed.nullifier.toBigInt()).toBe(16n);
      expect(fromHex).toHaveBeenCalledTimes(1);
    } finally {
      fromHex.mockRestore();
    }
  });

  it.each([-1n, modulus, undefined, 26])(
    "rejects unchecked construction from JavaScript (%p)",
    (input) => {
      // @ts-expect-error JavaScript can bypass the private constructor.
      expect(() => new Nullifier(input)).toThrow(RangeError);
    },
  );
});
// #endregion
