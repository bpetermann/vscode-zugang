import { ARIA_HIDDEN, ARIA_TAGS } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class AriaValidator implements RuleValidator {
  readonly tags: readonly string[] = ARIA_TAGS;

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    if (node.hasAttribute(ARIA_HIDDEN) && !node.canHaveAriaHidden()) {
      return [{ message: messages.aria.hidden }];
    }
    return [];
  }
}
