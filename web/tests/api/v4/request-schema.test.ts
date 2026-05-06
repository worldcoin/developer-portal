import { schema } from "@/api/v4/verify/request-schema";

describe("v4 verify request schema", () => {
  const integrityBundle = {
    version: 1,
    signature_format: "android_keystore",
    timestamp: 1772638272,
    signature: "abcd",
    jwt: "a.b.c",
  };

  it("applies default signal_hash for v4 uniqueness responses", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "credential",
          issuer_schema_id: 128,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.responses[0]?.signal_hash).toBe("0x0");
  });

  it("accepts optional top-level integrity_bundle", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      integrity_bundle: integrityBundle,
      responses: [
        {
          identifier: "credential",
          issuer_schema_id: 128,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.integrity_bundle).toEqual(integrityBundle);
  });

  it("rejects string integrity_bundle values", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        integrity_bundle: "v=1,sf=android_keystore,t=1772638272,s=abcd,jwt=a.b.c",
        responses: [
          {
            identifier: "credential",
            issuer_schema_id: 128,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it("rejects oversized integrity_bundle values", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        integrity_bundle: {
          ...integrityBundle,
          jwt: "x".repeat(8193),
        },
        responses: [
          {
            identifier: "credential",
            issuer_schema_id: 128,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
