import * as vscode from 'vscode';
import { RuleViolation } from './RuleValidator';

/**
 * Resolves a RuleViolation into a VS Code Range. One implementation per
 * pipeline encapsulates the parser-specific position math (HTML uses
 * character offsets via `TextDocument.positionAt`; TSX uses 1-indexed
 * line/column from Babel's SourceLocation).
 */
export interface PositionResolver {
  resolve(violation: RuleViolation): vscode.Range;
}

export const ZERO_RANGE = new vscode.Range(
  new vscode.Position(0, 0),
  new vscode.Position(0, 0),
);
