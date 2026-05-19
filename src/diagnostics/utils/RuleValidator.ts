import { DiagnosticSeverity } from 'vscode';
import { AccessibilityNode, NodeLocation } from './AccessibilityNode';

export interface RuleViolation {
  message: string;
  /** Attach the violation to a specific node (used by finalize-emitted violations). */
  node?: AccessibilityNode;
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
  /** Called once before each document run. Stateful validators clear their state here. */
  reset?(): void;
  /** Called once after traversal. Used to emit cross-document violations. */
  finalize?(context: ValidationContext): RuleViolation[];
}
