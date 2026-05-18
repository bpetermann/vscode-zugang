import { DiagnosticSeverity } from 'vscode';
import { AccessibilityNode, NodeLocation } from './AccessibilityNode';

export interface RuleViolation {
  message: string;
  loc?: NodeLocation;
  severity?: DiagnosticSeverity;
}

export interface ValidationContext {
  seenElements: string[];
}

export interface RuleValidator {
  readonly tags: readonly string[];
  validate(
    node: AccessibilityNode,
    context: ValidationContext,
  ): RuleViolation[];
}
