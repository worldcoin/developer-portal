import { isValidCredentiallessHttpsUrl } from "@/api/helpers/integration-url";

describe("review listing integration URLs", () => {
  it.each([
    "https://app.example.com",
    "HTTPS://app.example.com/path?draft=1#review",
    "https://127.0.0.1:8443/review",
    "https://[2001:db8::1]/review",
  ])("accepts a parseable credentialless HTTPS URL: %s", (value) => {
    expect(isValidCredentiallessHttpsUrl(value)).toBe(true);
  });

  it.each([
    "https://%",
    "https://",
    "http://app.example.com",
    "https://reviewer:secret@app.example.com",
    " https://app.example.com",
    "https://app.example.com\\@attacker.example",
    "not a url",
    "",
  ])("rejects a malformed or unsafe URL: %s", (value) => {
    expect(isValidCredentiallessHttpsUrl(value)).toBe(false);
  });
});
