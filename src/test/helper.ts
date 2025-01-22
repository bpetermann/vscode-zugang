import * as vscode from 'vscode';
import { TSXDiagnosticGenerator } from '../diagnostics/tsx/DiagnosticGenerator';

/** Logs all diagnostics messages */
export const logDiagnostics = (diagnostics: vscode.Diagnostic[]) => {
  console.log(
    'All diagnostic messages: ',
    diagnostics.map(({ message }) => message)
  );
};

export const div = (children: string | null, ...args: string[]) =>
  `<div ${args}>${children}</div>`;

export const fraction = (...args: string[]) => `<>${args}</>`;

/** Creates an html document based on a string. */
export const getDocument = (html: string) =>
  vscode.workspace.openTextDocument({
    content: html,
    language: 'html',
  });

/**
 * Generates diagnostics for an tsx document.
 */
export const generateDiagnostics = (document: vscode.TextDocument) =>
  new TSXDiagnosticGenerator(document.getText()).generateDiagnostics();

export const getTSXDocument = (tsx: string) =>
  vscode.workspace.openTextDocument({
    content: tsx,
    language: 'typescriptreact',
  });

export const createElement = (
  tag: string,
  attr?: {
    style?: { [k: string]: string | number | boolean };
    text?: string;
  }
) =>
  `<${tag}${
    attr?.style
      ? ` style={{${Object.entries(attr.style)
          .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`)
          .join(', ')}}}>`
      : '>'
  }${attr?.text ?? 'Some Text'}</${tag}>`;
