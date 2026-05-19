import { DiagnosticSeverity } from 'vscode';
import {
  ARIA_EXPANDED,
  BUTTON,
  DIV,
  ONCLICK,
  ROLE,
} from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const MAX_SEQUENCE_LENGTH = 4;

export class DivValidator implements RuleValidator {
  readonly tags: readonly string[] = [DIV];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    if (node.hasAttribute(ONCLICK) || node.getAttribute(ROLE) === BUTTON) {
      violations.push({
        message: messages.div.button,
        severity: DiagnosticSeverity.Hint,
      });
    }

    if (node.hasAttribute(ARIA_EXPANDED)) {
      violations.push({
        message: messages.div.expanded,
        severity: DiagnosticSeverity.Hint,
      });
    }

    if (node.getSequenceLength() >= MAX_SEQUENCE_LENGTH) {
      violations.push({
        message: messages.div.soup,
        severity: DiagnosticSeverity.Hint,
      });
    }

    return violations;
  }
}
