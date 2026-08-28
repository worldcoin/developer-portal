export const isValidCredentiallessHttpsUrl = (
  value: unknown,
): value is string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    /[\s\u0000-\u001f\u007f\\]/u.test(value)
  ) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
};
