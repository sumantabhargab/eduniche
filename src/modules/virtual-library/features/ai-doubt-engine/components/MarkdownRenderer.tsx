/**
 * MarkdownRenderer — robust Markdown + LaTeX + code rendering for AI answers.
 *
 * Stack:
 *  - react-markdown      — Markdown → React
 *  - remark-math v6      — parses $...$ (inline) and $$...$$ (display)
 *  - rehype-katex v7     — renders math via KaTeX
 *  - rehype-highlight    — syntax-highlights fenced code blocks
 *
 * Delimiter normalisation:
 *   remark-math only understands $ / $$ delimiters.
 *   AI output may use \( ... \) or \[ ... \] (LaTeX-native), so we
 *   normalise those to $ / $$ before handing the text to ReactMarkdown.
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

// KaTeX stylesheet (loaded from node_modules).
import "katex/dist/katex.min.css";

/**
 * Normalise LaTeX delimiters so remark-math (which only handles $ / $$)
 * can parse \(...\) and \[...\] from AI-generated content.
 */
function normalizeLatexDelimiters(text: string): string {
  // Order matters: do display-math first so \\[ inside \\[ ... \\] doesn't get
  // partially replaced.
  let result = text;

  // \[ ... \]  →  $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => `$$\n${inner}\n$$`);

  // \( ... \)  →  $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => `$${inner}$`);

  return result;
}

/**
 * Post-rehype pass: inject overflow styles into every KaTeX element
 * so wide equations never create horizontal scroll on the page.
 */
function clampKatex(tree: any) {
  if (!tree || !tree.children) return;
  for (const node of tree.children) {
    _clampNode(node);
  }
}
function _clampNode(node: any) {
  if (node.type !== "element") return;
  if (node.tagName !== "span" && node.tagName !== "pre") return;

  const cls = String(node.properties?.className ?? "");
  if (cls.includes("katex") || cls.includes("language-math")) {
    if (node.properties.style) {
      node.properties.style += ";max-width:100%;overflow-x:auto;display:inline-block";
    } else {
      node.properties.style = "max-width:100%;overflow-x:auto;display:inline-block";
    }
  }
  if (cls.includes("katex-display")) {
    if (node.properties.style) {
      node.properties.style += ";max-width:100%;overflow-x:auto;padding:0.5em 0";
    } else {
      node.properties.style = "max-width:100%;overflow-x:auto;padding:0.5em 0";
    }
  }
  for (const child of node.children ?? []) {
    _clampNode(child);
  }
}

const components = {
  // ---------- Code ----------
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode } & Record<string, unknown>) {
    const match = /language-(\w+)/.exec(className ?? "");
    const isBlock = !!match && match[1] !== "math";
    if (isBlock) {
      return (
        <div className="code-block-wrapper my-4 -mx-1">
          <div className="code-block-header">
            <span className="code-block-lang">{match![1]}</span>
          </div>
          <pre className={className}>
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    // Inline code (rehype-katex will replace math code blocks with KaTeX spans)
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  },

  // ---------- Headings ----------
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="md-heading">{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="md-heading">{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="md-subheading">{children}</h3>;
  },
  h4({ children }: { children?: React.ReactNode }) {
    return <h4 className="md-subheading-sm">{children}</h4>;
  },

  // ---------- Paragraphs ----------
  p({ children }: { children?: React.ReactNode }) {
    return <p className="md-paragraph">{children}</p>;
  },

  // ---------- Lists ----------
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="md-list">{children}</ul>;
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="md-list md-list-ordered">{children}</ol>;
  },
  li({ children }: { children?: React.ReactNode }) {
    return <li className="md-list-item">{children}</li>;
  },

  // ---------- Emphasis ----------
  strong({ children }: { children?: React.ReactNode }) {
    return <strong className="md-bold">{children}</strong>;
  },
  em({ children }: { children?: React.ReactNode }) {
    return <em className="md-italic">{children}</em>;
  },

  // ---------- Blockquote ----------
  blockquote({ children }: { children?: React.ReactNode }) {
    return <blockquote className="md-blockquote">{children}</blockquote>;
  },

  // ---------- Tables ----------
  table({ children }: { children?: React.ReactNode }) {
    return (
      <div className="md-table-wrapper">
        <table className="md-table">{children}</table>
      </div>
    );
  },
} as unknown as Components;

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const normalized = normalizeLatexDelimiters(content);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, clampKatex]}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
