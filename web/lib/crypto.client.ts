"use client";

/**
 * Client-side crypto utilities that can run in the browser
 */

/**
 * Re-inserts newlines into a PEM string if they are missing.
 * This heuristic extracts the header, footer, and body, and then
 * re-formats the body with line breaks every 64 characters.
 */
export const reformatPem = (pem: string): string => {
  const trimmedPem = pem.trim();

  // Check if there are no newline characters
  if (trimmedPem.indexOf("\n") === -1) {
    const headerMatch = trimmedPem.match(/(-----BEGIN [^-]+-----)/);
    const footerMatch = trimmedPem.match(/(-----END [^-]+-----)/);

    if (headerMatch && footerMatch) {
      const header = headerMatch[0];
      const footer = footerMatch[0];
      const body = trimmedPem
        .replace(header, "")
        .replace(footer, "")
        .replace(/\s+/g, "");
      const bodyLines = body.match(/.{1,64}/g)?.join("\n") || body;
      return `${header}\n${bodyLines}\n${footer}`;
    }
  }
  return pem;
};
