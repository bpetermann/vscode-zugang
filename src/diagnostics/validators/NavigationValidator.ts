import { ARIA_LABEL, ARIA_LABELLEDBY, NAV } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class NavigationValidator implements RuleValidator {
  readonly tags: readonly string[] = [NAV];
  private navs: AccessibilityNode[] = [];

  reset(): void {
    this.navs = [];
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    this.navs.push(node);
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    if (this.navs.length <= 1) {
      return [];
    }
    return this.navs
      .filter((nav) => !nav.hasAttribute(ARIA_LABEL) && !nav.hasAttribute(ARIA_LABELLEDBY))
      .map((nav) => ({ message: messages.nav.label, node: nav }));
  }
}
