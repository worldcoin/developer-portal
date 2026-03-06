// We stopped exporting this in IDKit 4.x
// Additing it here to keep compatibility with legacy endpoints that depend on it
export enum LegacyVerificationLevel {
  Orb = "orb",
  SecureDocument = "secure_document",
  Document = "document",
  Device = "device",
  Face = "face",
}
