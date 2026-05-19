import { ARIA_LABEL, ARIA_LABELLEDBY, SECTION } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class SectionValidator implements RuleValidator {
  readonly tags: readonly string[] = [SECTION];
  private sections: AccessibilityNode[] = [];

  reset(): void {
    this.sections = [];
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    this.sections.push(node);
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    if (this.sections.length <= 1) {
      return [];
    }
    return this.sections
      .filter((s) => !s.hasAttribute(ARIA_LABEL) && !s.hasAttribute(ARIA_LABELLEDBY))
      .map((s) => ({ message: messages.section.label, node: s }));
  }
}
