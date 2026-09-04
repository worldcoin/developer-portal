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

  it('accepts "selfie" as a v3 response identifier', async () => {
    const parsed = await schema.validate({
      protocol_version: "3.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "selfie",
          merkle_root: "0x01",
          nullifier: "0x02",
          proof: "0x03",
        },
      ],
    });

    expect(parsed.responses[0]?.identifier).toBe("selfie");
  });

  it("preserves min_protocol_version after schema validation", async () => {
    const parsed = await schema.validate({
      protocol_version: "3.0",
      min_protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      responses: [
        {
          identifier: "orb",
          merkle_root: "0x01",
          nullifier: "0x02",
          proof: "0x03",
        },
      ],
    });

    expect(parsed.min_protocol_version).toBe("4.0");
  });

  it("rejects an unsupported min_protocol_version", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        min_protocol_version: "5.0",
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
      }),
    ).rejects.toThrow();
  });

  it("rejects a session proof that declares protocol_version 3.0", async () => {
    await expect(
      schema.validate({
        protocol_version: "3.0",
        nonce: "0x01",
        session_id: "session_test",
        responses: [
          {
            identifier: "orb",
            merkle_root: "0x01",
            nullifier: "0x02",
            proof: "0x03",
          },
        ],
      }),
    ).rejects.toThrow("session proofs require protocol_version 4.0");
  });

  it("accepts a session proof on protocol_version 4.0", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      session_id: "session_test",
      responses: [
        {
          identifier: "credential",
          issuer_schema_id: 128,
          session_nullifier: ["0x01", "0x02"],
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
        },
      ],
    });

    expect(parsed.session_id).toBe("session_test");
  });

  it('preserves the "sandbox" environment after schema validation', async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      environment: "sandbox",
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

    expect(parsed.environment).toBe("sandbox");
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
        integrity_bundle:
          "v=1,sf=android_keystore,t=1772638272,s=abcd,jwt=a.b.c",
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

  it("requires the signed sybil_score for Self Check 4.0 responses", async () => {
    const parsed = await schema.validate({
      protocol_version: "4.0",
      nonce: "0x01",
      action: "test-action",
      integrity_bundle: { ...integrityBundle, version: 2 },
      responses: [
        {
          identifier: "selfie",
          issuer_schema_id: 11,
          nullifier: "0x02",
          expires_at_min: 1772584197,
          proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          sybil_score: 10,
        },
      ],
    });

    expect(parsed.responses[0]?.sybil_score).toBe(10);
  });

  it("rejects a Self Check 4.0 response without sybil_score", async () => {
    await expect(
      schema.validate({
        protocol_version: "4.0",
        nonce: "0x01",
        action: "test-action",
        responses: [
          {
            identifier: "selfie",
            issuer_schema_id: 11,
            nullifier: "0x02",
            expires_at_min: 1772584197,
            proof: ["0x1", "0x2", "0x3", "0x4", "0x5"],
          },
        ],
      }),
    ).rejects.toThrow("sybil_score is required for Self Check 4.0 responses");
  });
});
