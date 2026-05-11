/** Logged-in users who may start affiliate KYC (individual) in addition to KYB. */
// TODO: introduce SSM after testing to manage emails list on prod
const AFFILIATE_KYC_ALLOWED_EMAILS = new Set([
  "evgeniy.sabynin@toolsforhumanity.com",
  "natan.sklair@tooslforhumanity.com",
]);

export function isAffiliateKycEnabled(
  email: string | undefined | null,
): boolean {
  if (
    process.env.NEXT_PUBLIC_APP_ENV === "local" ||
    process.env.NEXT_PUBLIC_APP_ENV === "dev" ||
    process.env.NEXT_PUBLIC_APP_ENV === "staging"
  ) {
    return true;
  }

  if (!email?.trim()) {
    return false;
  }
  return AFFILIATE_KYC_ALLOWED_EMAILS.has(email.trim().toLowerCase());
}
