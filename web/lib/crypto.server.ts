"use server";
import { createPublicKey } from "crypto";

/**
 * Server-side crypto utilities
 */

export const normalizePublicKey = async (pem: string): Promise<string> => {
  // Reformat the PEM to ensure proper newlines if they're missing.
  const formattedPem = await reformatPem(pem);

  let key;
  const isPkcs1Format = formattedPem.includes("BEGIN RSA PUBLIC KEY");

  if (isPkcs1Format) {
    key = createPublicKey({
      key: formattedPem,
      format: "pem",
      type: "pkcs1",
    });
  } else {
    key = createPublicKey({
      key: formattedPem,
      format: "pem",
      type: "spki",
    });
  }

  // Export the key in the same format it was provided
  return key
    .export({
      type: isPkcs1Format ? "pkcs1" : "spki",
      format: "pem",
    })
    .toString();
};

/**
 * Re-inserts newlines into a PEM string if they are missing.
 * This heuristic extracts the header, footer, and body, and then
 * re-formats the body with line breaks every 64 characters.
 */
export const reformatPem = async (pem: string): Promise<string> => {
  const trimmedPem = pem.trim();
  // Check if there are no newline characters
  if (trimmedPem.indexOf("\n") === -1) {
    // Extract header and footer
    const headerMatch = trimmedPem.match(/(-----BEGIN [^-]+-----)/);
    const footerMatch = trimmedPem.match(/(-----END [^-]+-----)/);
    if (headerMatch && footerMatch) {
      const header = headerMatch[0];
      const footer = footerMatch[0];
      // Remove header and footer from the string
      const body = trimmedPem
        .replace(header, "")
        .replace(footer, "")
        .replace(/\s+/g, "");
      // Insert newline every 64 characters in the body
      const bodyLines = body.match(/.{1,64}/g)?.join("\n") || body;
      return `${header}\n${bodyLines}\n${footer}`;
    }
  }
  return pem;
};

/**
 * Validates an RSA public key in PEM format using Node's crypto module.
 * This function supports both SPKI and PKCS#1 PEM formats.
 *
 * @param value - The PEM string to validate.
 * @returns True if the key is a valid RSA public key, false otherwise.
 */
export const validatePublicKey = async (
  value: string | undefined,
): Promise<boolean> => {
  if (!value) return true; // Allow empty values since it's optional

  const formattedPem = await reformatPem(value);

  try {
    let key;
    // Use the appropriate type based on the header.
    if (formattedPem.includes("BEGIN RSA PUBLIC KEY")) {
      key = createPublicKey({
        key: formattedPem,
        format: "pem",
        type: "pkcs1",
      });
    } else {
      key = createPublicKey({
        key: formattedPem,
        format: "pem",
        type: "spki",
      });
    }
    // Verify that the key is RSA.
    return key.asymmetricKeyType === "rsa";
  } catch (e) {
    console.error("Server-side key validation error:", e);
    return false;
  }
};
