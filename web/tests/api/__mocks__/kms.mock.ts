import { createPrivateKey, createSign } from "crypto";
import { privateJwk } from "./jwk";

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
  scheduleKeyDeletion: jest.fn(),
};
