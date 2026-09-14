import clsx from "clsx";
import { ComponentProps, CSSProperties, memo, useCallback } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { PreTag } from "./PreTag";

SyntaxHighlighter.registerLanguage("javascript", javascript);

// CSS variables respond before hydration and avoid re-rendering the highlighter
// when appearance changes. Original light colors remain exact.
const syntaxColors: Record<string, string> = {
  "#383a42": "var(--code-foreground)",
  "#a0a1a7": "var(--code-comment)",
  "#a626a4": "var(--code-keyword)",
  "#50a14f": "var(--code-string)",
  "#986801": "var(--code-number)",
  "#4078f2": "var(--code-function)",
  "#e45649": "var(--code-tag)",
  "#0184bb": "var(--code-literal)",
  "#c18401": "var(--code-builtin)",
};
const syntaxTheme: Record<string, CSSProperties> = Object.fromEntries(
  Object.entries(atomOneLight).map(([token, style]) => [
    token,
    {
      ...style,
      ...(style.color
        ? { color: syntaxColors[String(style.color)] ?? style.color }
        : {}),
    },
  ]),
);

export const CodeBlock = memo(function CodeBlock(
  props: {
    code: string;
    theme: "error" | "neutral" | "success";
    language: string;
    showLineNumbers?: boolean;
    className?: string;
    loading?: boolean;
  } & (
    | { caption: string; captionClassName?: string }
    | { caption?: never; captionClassName?: never }
  ),
) {
  const preTag = useCallback(
    (preTagProps: ComponentProps<any>) => (
      <PreTag theme={props.theme} loading={props.loading}>
        {preTagProps.children}
      </PreTag>
    ),
    [props.loading, props.theme],
  );

  const codeTag = useCallback(
    (codeTagProps: ComponentProps<any>) => (
      <code className="font-ibm">{codeTagProps.children}</code>
    ),
    [],
  );

  return (
    <figure className={clsx("grid gap-y-3.5", props.className)}>
      {props.caption && (
        <figcaption className={clsx("text-14", props.captionClassName)}>
          {props.caption}
        </figcaption>
      )}

      <SyntaxHighlighter
        language={props.language}
        showLineNumbers={props.showLineNumbers}
        wrapLines
        style={syntaxTheme}
        showInlineLineNumbers
        lineNumberStyle={{
          padding: "2px 4px",
          minWidth: "30px",
          boxSizing: "content-box",
          textAlign: "start",
          color: clsx(
            { "var(--content-link-legacy)": props.theme === "neutral" },
            { "var(--content-error-700)": props.theme === "error" },
            { "var(--content-success-700)": props.theme === "success" },
          ),
          borderRight: `1px solid ${clsx(
            { "var(--content-link-legacy)": props.theme === "neutral" },
            { "var(--content-error-700)": props.theme === "error" },
            { "var(--content-success-700)": props.theme === "success" },
          )}`,
          marginRight: "16px",
        }}
        PreTag={preTag}
        CodeTag={codeTag}
      >
        {props.code}
      </SyntaxHighlighter>
    </figure>
  );
});
