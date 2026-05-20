import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import { RuleViolation } from './RuleValidator';

/**
 * Single factory that turns a RuleViolation + resolved Range into a
 * vscode.Diagnostic. Shared by both HTML and TSX pipelines so diagnostic
 * construction lives in one place.
 */
export function buildDiagnostic(
  violation: RuleViolation,
  range: vscode.Range,
): vscode.Diagnostic {
  return new vscode.Diagnostic(
    range,
    violation.message,
    violation.severity ?? DiagnosticSeverity.Warning,
  );
}
