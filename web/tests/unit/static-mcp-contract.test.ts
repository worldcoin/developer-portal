import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readStaticMcpContract } from "../../scripts/lib/static-mcp-contract";

// #region Fixtures
const makeSource = (text: string) => {
  const root = mkdtempSync(join(tmpdir(), "mcp-contract-"));
  const entry = join(root, "index.ts");
  writeFileSync(entry, text);
  return { root, entry };
};
// #endregion

// #region Static contract evaluation
describe("MCP contract extraction", () => {
  it("resolves imported const-array spreads without executing the imported module", () => {
    const { root, entry } = makeSource(
      'import { OUTCOMES as outcomes } from "./outcomes"; const toolDefinitions = [{ inputSchema: { enum: [...outcomes] } }];',
    );
    writeFileSync(
      join(root, "outcomes.ts"),
      'throw new Error("Module must never execute"); export const OUTCOMES = ["success", "expired", "invalid_proof"] as const;',
    );
    expect(readStaticMcpContract(entry, root)).toEqual([
      { inputSchema: { enum: ["success", "expired", "invalid_proof"] } },
    ]);
  });

  it("rejects executable expressions and cycles", () => {
    const call = makeSource("const toolDefinitions = process.exit(0);");
    expect(() => readStaticMcpContract(call.entry, call.root)).toThrow(
      "static data",
    );
    const cycle = makeSource("const a = [a]; const toolDefinitions = [...a];");
    expect(() => readStaticMcpContract(cycle.entry, cycle.root)).toThrow(
      "Cyclic",
    );
  });

  it("rejects external dependencies and imports outside the source root", () => {
    const external = makeSource(
      'import { definitions } from "external-package"; const toolDefinitions = definitions;',
    );
    expect(() => readStaticMcpContract(external.entry, external.root)).toThrow(
      "External",
    );
    const outside = makeSource(
      'import { definitions } from "../outside"; const toolDefinitions = definitions;',
    );
    expect(() => readStaticMcpContract(outside.entry, outside.root)).toThrow(
      "escaped",
    );
  });

  it("requires literal arrays when spreading", () => {
    const { root, entry } = makeSource(
      'const names = "success"; const toolDefinitions = [...names];',
    );
    expect(() => readStaticMcpContract(entry, root)).toThrow("literal array");
  });
});
// #endregion
