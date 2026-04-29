import { schema } from "@/api/v4/verify/request-schema";

describe("v4 verify request schema", () => {
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
    });

    expect(parsed.integrity_bundle).toBe(
      "v=1,sf=android_keystore,t=1772638272,s=abcd,jwt=a.b.c",
    );
  });
});
