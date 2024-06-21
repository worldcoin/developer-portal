import { createPrivateKey, createPublicKey, createSign } from "crypto";
import { privateJwk, publicJwk } from "./jwk";

module.exports = {
  getKMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (signCommand) => {
      if (!signCommand.input.Message) {
        throw new Error("Improper call, no message to sign.");
      }

      const key = createPrivateKey({ format: "jwk", key: privateJwk });
      const sign = createSign("RSA-SHA256");
      sign.update(Buffer.from(signCommand.input.Message));
      return {
        Signature: new Uint8Array(sign.sign(key).buffer),
      };
    }),
  })),
  signJWTWithKMSKey: jest.requireActual("legacy/backend/kms").signJWTWithKMSKey,
  createKMSKey: jest.fn().mockImplementation(async () => {
    const key = createPublicKey({ format: "jwk", key: publicJwk });
    const pemKey = key.export({ type: "pkcs1", format: "pem" });
    return {
      keyId: "test-kms-key-id",
      publicKey: pemKey,
    };
  }),
  scheduleKeyDeletion: jest.fn(),
};
