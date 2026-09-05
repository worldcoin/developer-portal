import { readFileSync, realpathSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

/** Read literal contracts and const imports without executing handler/helper modules. */
export function readStaticMcpContract(entry: string, root: string): unknown {
  root = realpathSync(root);
  const sources = new Map<string, ts.SourceFile>();
  const resolving = new Set<string>();
  const source = (path: string) => {
    const rel = relative(root, path);
    if (rel.startsWith("..") || rel.startsWith("/"))
      throw new Error("Contract import escaped the source root");
    path = realpathSync(path);
    if (relative(root, path).startsWith(".."))
      throw new Error("Contract symlink escaped the source root");
    if (!sources.has(path))
      sources.set(
        path,
        ts.createSourceFile(
          path,
          readFileSync(path, "utf8"),
          ts.ScriptTarget.Latest,
          true,
        ),
      );
    return sources.get(path)!;
  };

  function valueOf(name: string, file: ts.SourceFile, depth: number): unknown {
    const key = `${file.fileName}:${name}`;
    if (resolving.has(key))
      throw new Error(`Cyclic contract constant: ${name}`);
    resolving.add(key);
    try {
      for (const statement of file.statements) {
        if (
          ts.isVariableStatement(statement) &&
          statement.declarationList.flags & ts.NodeFlags.Const
        ) {
          for (const declaration of statement.declarationList.declarations) {
            if (
              ts.isIdentifier(declaration.name) &&
              declaration.name.text === name &&
              declaration.initializer
            )
              return literal(declaration.initializer, file, depth + 1);
          }
        }
        if (
          ts.isImportDeclaration(statement) &&
          ts.isStringLiteral(statement.moduleSpecifier)
        ) {
          const bindings = statement.importClause?.namedBindings;
          if (!bindings || !ts.isNamedImports(bindings)) continue;
          const binding = bindings.elements.find(
            (element) => element.name.text === name,
          );
          if (!binding) continue;
          const module = statement.moduleSpecifier.text;
          if (!module.startsWith("@/") && !module.startsWith("."))
            throw new Error(
              `External contract imports are not supported: ${module}`,
            );
          const imported = resolve(
            module.startsWith("@/") ? root : dirname(file.fileName),
            module.startsWith("@/") ? module.slice(2) : module,
          );
          return valueOf(
            binding.propertyName?.text || binding.name.text,
            source(imported.endsWith(".ts") ? imported : `${imported}.ts`),
            depth + 1,
          );
        }
      }
      throw new Error(`Unresolved contract constant: ${name}`);
    } finally {
      resolving.delete(key);
    }
  }

  function literal(
    node: ts.Expression,
    file: ts.SourceFile,
    depth: number,
  ): unknown {
    if (depth > 40) throw new Error("Contract nesting is too deep");
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node)
    )
      return literal(node.expression, file, depth + 1);
    if (ts.isIdentifier(node)) return valueOf(node.text, file, depth + 1);
    if (ts.isArrayLiteralExpression(node)) {
      const values: unknown[] = [];
      for (const element of node.elements) {
        if (ts.isSpreadElement(element)) {
          const spread = literal(element.expression, file, depth + 1);
          if (!Array.isArray(spread))
            throw new Error(
              "Contract array spread must resolve to a literal array",
            );
          values.push(...spread);
        } else values.push(literal(element, file, depth + 1));
      }
      return values;
    }
    if (ts.isObjectLiteralExpression(node))
      return Object.fromEntries(
        node.properties.map((property) => {
          if (!ts.isPropertyAssignment(property))
            throw new Error("Contract objects must use explicit properties");
          if (
            !ts.isIdentifier(property.name) &&
            !ts.isStringLiteral(property.name)
          )
            throw new Error(
              "Computed contract property names are not supported",
            );
          return [
            property.name.text,
            literal(property.initializer, file, depth + 1),
          ];
        }),
      );
    throw new Error(
      "Contract must be static data; calls and executable expressions are not supported",
    );
  }
  return valueOf("toolDefinitions", source(realpathSync(resolve(entry))), 0);
}
