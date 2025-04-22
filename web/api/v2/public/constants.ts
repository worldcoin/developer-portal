// TODO remove when min app is higher
export const CONTACTS_APP_AVAILABLE_FROM = "2.8.7803";
export const STARTER_KIT_APP_AVAILABLE_FROM = "2.8.8100";

export const OFFICE_IPS = process.env.NEXT_PUBLIC_OFFICE_IPS
  ? process.env.NEXT_PUBLIC_OFFICE_IPS?.split(",")
  : ["158.247.70.32", "158.247.70.38"];
