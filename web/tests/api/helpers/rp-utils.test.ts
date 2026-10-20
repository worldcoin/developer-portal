import { generateRandomRpIdString } from "@/api/helpers/rp-utils";
import crypto from "crypto";

describe("generateRandomRpIdString", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps leading zeroes and returns lowercase 8-byte hex", () => {
    const randomBytes = jest.spyOn(
      crypto,
      "randomBytes",
    ) as unknown as jest.Mock;
    randomBytes.mockReturnValue(Buffer.from("00abcdef12345678", "hex"));

    expect(generateRandomRpIdString()).toBe("rp_00abcdef12345678");
  });

  it("retries the all-zero uint64", () => {
    const randomBytes = jest.spyOn(
      crypto,
      "randomBytes",
    ) as unknown as jest.Mock;
    randomBytes
      .mockReturnValueOnce(Buffer.alloc(8))
      .mockReturnValueOnce(Buffer.from("0000000000000001", "hex"));

    expect(generateRandomRpIdString()).toBe("rp_0000000000000001");
    expect(randomBytes).toHaveBeenCalledTimes(2);
  });
});
