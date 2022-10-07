import { ComponentProps, memo, useCallback } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { PreTag } from "./PreTag";
import cn from "classnames";

export const CodeBlock = memo(function CodeBlock(
  props: {
    code: string;
    theme: "error" | "neutral" | "success";
    language: string;
    hideLineNumbers?: boolean;
    className?: string;
    preTagClassName?: string;
    loading?: boolean;
  } & (
    | { caption: string; captionClassName?: string }
    | { caption?: never; captionClassName?: never }
  )
) {
  const preTag = useCallback(
    (preTagProps: ComponentProps<any>) => (
      <PreTag
        className={props.preTagClassName}
        theme={props.theme}
        loading={props.loading}
      >
        {preTagProps.children}
      </PreTag>
    ),
    [props.loading, props.theme, props.preTagClassName]
  );

  const codeTag = useCallback(
    (codeTagProps: ComponentProps<any>) => (
      <code className="font-ibm">{codeTagProps.children}</code>
    ),
    []
  );

  return (
    <figure className={cn("grid gap-y-3.5", props.className)}>
      {props.caption && (
        <figcaption className={cn("text-14", props.captionClassName)}>
          {props.caption}
        </figcaption>
      )}

      <SyntaxHighlighter
        language={props.language}
        showLineNumbers={!props.hideLineNumbers}
        wrapLines
        showInlineLineNumbers
        lineNumberStyle={{
          padding: "8px 16px",
          minWidth: "30px",
          boxSizing: "content-box",
          textAlign: "center",
          color: cn(
            { "#4940e0": props.theme === "neutral" },
            { "#ff5a76": props.theme === "error" },
            { "#00c313": props.theme === "success" }
          ),
          borderRight: `1px solid ${cn(
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
