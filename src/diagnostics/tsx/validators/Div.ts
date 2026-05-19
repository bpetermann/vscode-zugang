import { DiagnosticSeverity } from 'vscode';
import {
  ARIA_EXPANDED,
  ARIA_HIDDEN,
  BUTTON,
  DIV,
  ONCLICK,
  ROLE,
  TRUE,
} from '../../utils/constants';
import { messages } from '../../utils/messages';
import { AccessibilityNode } from '../../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../../utils/RuleValidator';

const MAX_SEQUENCE_LENGTH = 5;

export class DivValidator implements RuleValidator {
  readonly tags: readonly string[] = [DIV];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    if (node.getSequenceLength() >= MAX_SEQUENCE_LENGTH) {
      violations.push({
        message: messages.div.soup,
        severity: DiagnosticSeverity.Information,
      });
    }

    if (node.hasAttribute(ONCLICK) || node.getAttribute(ROLE) === BUTTON) {
      violations.push({
        message: messages.div.button,
        severity: DiagnosticSeverity.Information,
      });
    }

    if (node.getAttribute(ARIA_EXPANDED) !== undefined) {
      violations.push({
        message: messages.div.expanded,
        severity: DiagnosticSeverity.Hint,
      });
    }

    if (node.getAttribute(ARIA_HIDDEN) === TRUE && !node.canHaveAriaHidden()) {
      violations.push({ message: messages.div[ARIA_HIDDEN] });
    }

    const abstractRole = node.getAbstractRole();
    if (abstractRole) {
      violations.push({ message: messages.div.abstract + abstractRole });
    }

    return violations;
  }
}
