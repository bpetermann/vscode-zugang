import { DiagnosticSeverity } from 'vscode';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  ARIA_EXPANDED,
  ARIA_HIDDEN,
  BUTTON,
  DIV,
  ONCLICK,
  ROLE,
  TRUE,
} from '../utils/constants';
import { messages } from '../utils/messages';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const MAX_SEQUENCE_LENGTH = 4;

export class DivValidator implements RuleValidator {
  readonly tags: readonly string[] = [DIV];

  validate(
    node: AccessibilityNode,
    _context: ValidationContext,
  ): RuleViolation[] {
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

    if (node.getAttribute(ARIA_HIDDEN) === TRUE && !node.canHaveAriaHidden()) {
      violations.push({
        message: messages.div[ARIA_HIDDEN],
        severity: DiagnosticSeverity.Hint,
      });
    }

    const abstractRole = node.getAbstractRole();
    if (abstractRole) {
      violations.push({
        message: messages.div.abstract + abstractRole,
        severity: DiagnosticSeverity.Hint,
      });
    }

    return violations;
  }
}
