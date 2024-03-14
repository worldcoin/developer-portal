import { setConfig } from "next/config";
import "whatwg-fetch";

setConfig({
  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) =>
      key.startsWith("NEXT_PUBLIC_"),
    ),
  ),
});

export const MOCKED_GENERAL_SECRET_KEY =
  "0xsuperSecretKey99994ab56046d4d97695b9999999";

process.env.GENERAL_SECRET_KEY = MOCKED_GENERAL_SECRET_KEY;

