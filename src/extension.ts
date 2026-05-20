import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import { HTMLDiagnosticGenerator } from './diagnostics/html/DiagnosticGenerator';
import { TSXDiagnosticGenerator } from './diagnostics/tsx/DiagnosticGenerator';
import { HTML, TYPESCRIPT_REACT } from './diagnostics/utils/constants';
import { ParseError } from './diagnostics/utils/ParseError';

class DiagnosticManager {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor(context: vscode.ExtensionContext) {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('accessibility');
    context.subscriptions.push(this.diagnosticCollection);
  }

  updateDiagnostics(
    document: vscode.TextDocument,
    diagnostics: vscode.Diagnostic[]
  ) {
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}

/**
 * Run the accessibility pipeline for a single text document and return the
 * resulting diagnostics. A {@link ParseError} thrown by either generator is
 * surfaced as a single diagnostic anchored at (0,0) so the user sees the
 * failure inline rather than silently losing all checks for the file.
 */
export function generateDocumentDiagnostics(
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const text = document.getText();
  try {
    switch (document.languageId) {
      case HTML:
        return new HTMLDiagnosticGenerator(text, document).generateDiagnostics();
      case TYPESCRIPT_REACT:
        return new TSXDiagnosticGenerator(text).generateDiagnostics();
      default:
        return [];
    }
  } catch (error) {
    if (error instanceof ParseError) {
      const zero = new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(0, 0)
      );
      return [
        new vscode.Diagnostic(zero, error.message, DiagnosticSeverity.Error),
      ];
    }
    throw error;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const diagnosticManager = new DiagnosticManager(context);

  vscode.workspace.onDidChangeTextDocument((event) => {
    diagnosticManager.updateDiagnostics(
      event.document,
      generateDocumentDiagnostics(event.document)
    );
  });
}

export function deactivate() {}
