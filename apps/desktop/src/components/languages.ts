import type { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";

/** Languages offered as presets in the code-card editor. */
export const LANGUAGE_PRESETS = [
  "text",
  "bash",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "python",
  "rust",
  "c",
  "cpp",
  "css",
  "html",
  "json",
  "sql",
  "markdown",
  "yaml",
] as const;

/** Resolve a language id to CodeMirror extensions. Unknown → no highlighting. */
export function languageExtension(language: string): Extension[] {
  switch (language.toLowerCase()) {
    case "javascript":
    case "js":
      return [javascript()];
    case "jsx":
      return [javascript({ jsx: true })];
    case "typescript":
    case "ts":
      return [javascript({ typescript: true })];
    case "tsx":
      return [javascript({ typescript: true, jsx: true })];
    case "python":
    case "py":
      return [python()];
    case "rust":
    case "rs":
      return [rust()];
    case "c":
    case "cpp":
    case "c++":
    case "cxx":
      return [cpp()];
    case "css":
      return [css()];
    case "html":
      return [html()];
    case "json":
      return [json()];
    case "sql":
      return [sql()];
    case "markdown":
    case "md":
      return [markdown()];
    default:
      return [];
  }
}
