import {
  ARIA_LABELLEDBY,
  ID,
  INPUT,
  LABEL,
} from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class InputValidator implements RuleValidator {
  readonly tags: readonly string[] = [INPUT];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const parentIsLabel = node.parent?.name === LABEL;
    const prevIsLabel = node.previousElementSibling?.name === LABEL;
    const hasId = node.hasAttribute(ID);
    const hasAriaLabelledBy = node.hasAttribute(ARIA_LABELLEDBY);

    if (parentIsLabel || (prevIsLabel && hasId) || hasAriaLabelledBy) {
      return [];
    }
    return [{ message: messages.input.label }];
  }
}
