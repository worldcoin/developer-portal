"use client";

/**
 * Client-side crypto utilities that can run in the browser
 */

/**
 * Normalizes a public key PEM to the standard SPKI PEM string format for public keys,
 * using the Web Crypto API in the browser.
 *
 * Note: This client implementation only supports SPKI formatted keys
 * (with "-----BEGIN PUBLIC KEY-----" header). PKCS#1 formatted keys are not supported.
 *
 * @param pem - The public key PEM to normalize.
 * @returns A Promise that resolves to the normalized PEM string.
 */
export const normalizePublicKey = async (
  pem: string,
): Promise<string> => {
  // Reformat the PEM to ensure proper newlines if they're missing.
  const formattedPem = reformatPem(pem);

  // Only support SPKI keys in the browser.
  if (
    !formattedPem.includes("-----BEGIN PUBLIC KEY-----") ||
    !formattedPem.includes("-----END PUBLIC KEY-----")
  ) {
    throw new Error(
      "normalizePublicKeyClient only supports SPKI PEM format. Please provide a key with '-----BEGIN PUBLIC KEY-----'.",
    );
  }

  // Remove header, footer, and whitespace to extract the Base64 body.
  const b64 = formattedPem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  // Convert the Base64 string to an ArrayBuffer.
  const binaryDer = base64ToArrayBuffer(b64);

  // Import the key using the Web Crypto API.
  const cryptoKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true, // extractable
    [], // no key usages needed for normalization
  );

  // Export the key as SPKI.
  const exportedBuffer = await window.crypto.subtle.exportKey(
    "spki",
    cryptoKey,
  );

  // Convert the exported ArrayBuffer to a Base64 string.
  const exportedB64 = arrayBufferToBase64(exportedBuffer);

  // Insert newlines every 64 characters for PEM formatting.
  const exportedB64WithNewlines =
    exportedB64.match(/.{1,64}/g)?.join("\n") || exportedB64;

  // Wrap with the SPKI header and footer.
  const normalizedPem = `-----BEGIN PUBLIC KEY-----\n${exportedB64WithNewlines}\n-----END PUBLIC KEY-----`;

  return normalizedPem;
};

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

/**
 * Validates an RSA public key in PEM (SPKI) format using the Web Crypto API.
 * This function works in the browser and only supports SPKI PEMs (with BEGIN/END PUBLIC KEY).
 *
 * @param value - The PEM string to validate.
 * @returns A Promise that resolves to true if the key is valid, or false otherwise.
 */
export const validatePublicKey = async (
  value: string | undefined,
): Promise<boolean> => {
  if (!value) return true; // Allow empty values

  const formattedPem = reformatPem(value);

  // Ensure the PEM is in SPKI format.
  if (
    !formattedPem.includes("-----BEGIN PUBLIC KEY-----") ||
    !formattedPem.includes("-----END PUBLIC KEY-----")
  ) {
    console.error("Only SPKI PEM format is supported in the browser.");
    return false;
  }

  // Remove header/footer and whitespace to extract the Base64 content.
  const b64 = formattedPem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  try {
    const binaryDer = base64ToArrayBuffer(b64);
    // Try importing the key using the Web Crypto API.
    // Here we use RSA-OAEP with SHA-256 as an example.
    await window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );
    return true;
  } catch (e) {
    console.error("Failed to import key:", e);
    return false;
  }
};

/**
 * Converts an ArrayBuffer to a Base64-encoded string.
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Converts a Base64-encoded string to an ArrayBuffer.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
