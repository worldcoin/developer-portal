import { formatNullifierHex } from "@/lib/format-nullifier";

it("renders a decimal nullifier as truncated 0x hex and passes invalid input through", () => {
  expect(formatNullifierHex(BigInt("0x1f9a4c7e0000b8e2").toString(10))).toBe(
    "0x1f9a4c7e…b8e2",
  );
  expect(formatNullifierHex("255")).toBe("0xff");
  expect(formatNullifierHex("not-a-number")).toBe("not-a-number");
});
