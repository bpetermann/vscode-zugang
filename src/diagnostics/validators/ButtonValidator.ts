import { DiagnosticSeverity } from 'vscode';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  ARIA_CHECKED,
  ARIA_LABEL,
  ARIA_LABELLEDBY,
  BUTTON,
  DISABLED,
  IMG,
  ROLE,
  SWITCH,
  TABINDEX,
  TITLE,
} from '../utils/constants';
import { messages } from '../utils/messages';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class ButtonValidator implements RuleValidator {
  readonly tags: readonly string[] = [BUTTON];

  validate(
    node: AccessibilityNode,
    _context: ValidationContext,
  ): RuleViolation[] {
    const violations: RuleViolation[] = [];

    const tabIndex = node.getAttribute(TABINDEX);
    if (tabIndex !== undefined && +tabIndex > 0) {
      violations.push({
        message: messages.button.tabindex,
        severity: DiagnosticSeverity.Hint,
      });
    }

    if (node.hasAttribute(DISABLED)) {
      violations.push({ message: messages.button.disabled });
    }

    if (
      node.getAttribute(ROLE) === SWITCH &&
      !node.hasAttribute(ARIA_CHECKED)
    ) {
      violations.push({
        message: messages.button.switch,
        severity: DiagnosticSeverity.Hint,
      });
    }

    const attrs = node.getAttributes();
    if (
      !node.text &&
      !node.getChild(IMG) &&
      !attrs.includes(ARIA_LABEL) &&
      !attrs.includes(ARIA_LABELLEDBY) &&
      !attrs.includes(TITLE)
    ) {
      violations.push({ message: messages.button.text });
    }

    const abstractRole = node.getAbstractRole();
    if (abstractRole) {
      violations.push({ message: messages.button.abstract + abstractRole });
    }

    return violations;
  }
}
