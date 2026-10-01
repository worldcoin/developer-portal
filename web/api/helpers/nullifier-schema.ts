import { Nullifier } from "@/lib/nullifier";
import * as yup from "yup";

// Parse once at the JSON boundary. Invalid input remains a schema error (400).
export const nullifierSchema = yup
  .mixed<Nullifier>()
  .transform((_value, originalValue) => {
    try {
      return Nullifier.fromHex(originalValue);
    } catch {
      return originalValue;
    }
  })
  .test(
    "nullifier",
    "Invalid nullifier. Expected 1–64 hex digits within the World ID field, with optional 0x prefix.",
    (value) => value instanceof Nullifier,
  );
