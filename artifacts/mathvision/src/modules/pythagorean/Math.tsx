import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export type MathProps = {
  /** LaTeX source. Pass it here or as children. */
  math?: string;
  children?: string;
  /** Render as a centered block equation instead of inline. */
  displayMode?: boolean;
  className?: string;
};

/**
 * Renders a LaTeX string with proper KaTeX typesetting.
 * The KaTeX CSS only styles elements carrying the `.katex` class,
 * so it stays inert outside the module.
 */
export function Math({
  math,
  children,
  displayMode = false,
  className = "",
}: MathProps) {
  const html = useMemo(() => {
    const source = math ?? children ?? "";
    return katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  }, [math, children, displayMode]);

  if (displayMode) {
    return (
      <div
        className={`pth-eq pth-eq--display ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`pth-eq pth-eq--inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Math;