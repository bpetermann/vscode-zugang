import { GENERIC_TEXTS, HREF, LINK, ONCLICK } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { AccessibilityNode } from '../../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../../utils/RuleValidator';

export class LinkValidator implements RuleValidator {
  readonly tags: readonly string[] = [LINK];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const text = node.text;

    if (text && GENERIC_TEXTS.includes(text.trim().toLowerCase())) {
      violations.push({ message: messages.link.generic + text });
    }

    if (node.hasAttribute(ONCLICK)) {
      violations.push({ message: messages.link.onclick });
    }

    const href = node.getAttribute(HREF);
    if (href?.startsWith('mailto:') && !text?.includes('@')) {
      violations.push({ message: messages.link.mail });
    }

    return violations;
  }
}
