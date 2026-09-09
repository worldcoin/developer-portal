import { TextDecoder, TextEncoder } from "node:util";

// jsdom does not provide these browser APIs, used by the shared UI imports.
Object.assign(globalThis, { TextDecoder, TextEncoder });
