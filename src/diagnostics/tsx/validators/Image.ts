import { ALT, GENERIC_ALT, IMG } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { AccessibilityNode } from '../../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../../utils/RuleValidator';

export class ImageValidator implements RuleValidator {
  readonly tags: readonly string[] = [IMG];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];

    if (!node.hasAttribute(ALT)) {
      violations.push({ message: messages.img.alt });
    }

    const altText = node.getAttribute(ALT);
    if (altText && altText.split(' ').some((t) => GENERIC_ALT.includes(t))) {
      violations.push({ message: messages.img.generic + altText });
    }

    return violations;
  }
}
