import { ComponentProps, memo, useCallback } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { PreTag } from "./PreTag";
import clsx from "clsx";

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
  )
) {
  const preTag = useCallback(
    (preTagProps: ComponentProps<any>) => (
      <PreTag theme={props.theme} loading={props.loading}>
        {preTagProps.children}
      </PreTag>
    ),
    [props.loading, props.theme]
  );

  const codeTag = useCallback(
    (codeTagProps: ComponentProps<any>) => (
      <code className="font-ibm border-0 ">{codeTagProps.children}</code>
    ),
    []
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
        style={atomOneLight}
        wrapLongLines
        theme="gradient-dark"
        showInlineLineNumbers
        lineNumberStyle={{
          padding: "8px 16px",
          minWidth: "30px",
          boxSizing: "content-box",
          textAlign: "center",
          color: clsx(
            { "#4940e0": props.theme === "neutral" },
            { "#ff5a76": props.theme === "error" },
            { "#00c313": props.theme === "success" }
          ),
          borderRight: `1px solid ${clsx(
            { "#4940e0": props.theme === "neutral" },
            { "#ff5a76": props.theme === "error" },
            { "#00c313": props.theme === "success" }
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
