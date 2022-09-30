import { setConfig } from "next/config";
import "whatwg-fetch";

setConfig({
  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) =>
      key.startsWith("NEXT_PUBLIC_")
    )
  ),
});
