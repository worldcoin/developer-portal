// Keep aligned with the validation rules in ../../Configuration/Advanced/page/form-schema
const HTTPS_URL_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;

export const normalizeDomainInput = (value: string): string => {
  const domain = value.trim();

  return /^[a-z][a-z\d+.-]*:\/\//i.test(domain) ? domain : `https://${domain}`;
};

export const isValidHttpsDomain = (value: string): boolean =>
  HTTPS_URL_REGEX.test(value);
