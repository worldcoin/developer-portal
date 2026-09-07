jest.mock("server-only", () => ({}));

import { emailForInsensitiveLookup } from "@/api/helpers/is-email-user";

describe("emailForInsensitiveLookup", () => {
  it("trims and lowercases the address", () => {
    expect(emailForInsensitiveLookup("  Foo@Example.COM  ")).toEqual(
      "foo@example.com",
    );
  });

  it("escapes ILIKE wildcards so they match literally", () => {
    expect(emailForInsensitiveLookup("a_b%c@x.com")).toEqual("a\\_b\\%c@x.com");
  });
});
