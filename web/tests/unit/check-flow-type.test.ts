import { checkFlowType } from "@/api/helpers/oidc";
import { OIDCFlowType } from "@/lib/types";

describe("Check flow type", () => {
  test("Detects authorization code flow", () => {
    const validResponseTypes = ["code"];

    validResponseTypes.forEach((responseType) => {
      const responseTypes = responseType.split(" ");
      expect(checkFlowType(responseTypes)).toBe(OIDCFlowType.AuthorizationCode);
    });
  });

  test("Detects implicit flow", () => {
    const validResponseTypes = ["token id_token", "id_token token", "id_token"];
    validResponseTypes.forEach((responseType) => {
      const responseTypes = responseType.split(" ");
      expect(checkFlowType(responseTypes)).toBe(OIDCFlowType.Implicit);
    });
  });

  test("Detects hybrid flow", () => {
    const validResponseTypes = [
      "code id_token",
      "id_token code",
      "code token",
      "token code",
      "code id_token token",
      "code token id_token",
      "token code id_token",
      "token id_token code",
      "id_token code token",
      "id_token token code",
    ];

    validResponseTypes.forEach((responseType) => {
      const responseTypes = responseType.split(" ");
      expect(checkFlowType(responseTypes)).toBe(OIDCFlowType.Hybrid);
    });
  });

  test("Detects `token` flow", () => {
    const validResponseTypes = ["token"];

    validResponseTypes.forEach((responseType) => {
      const responseTypes = responseType.split(" ");
      expect(checkFlowType(responseTypes)).toBe(OIDCFlowType.Token);
    });
  });

  test("Detects invalid flow", () => {
    const invalidResponseTypes = ["value", "value1 value2"];

    invalidResponseTypes.forEach((responseType) => {
      const responseTypes = responseType.split(" ");
      expect(checkFlowType(responseTypes)).toBe(null);
    });
  });
});
