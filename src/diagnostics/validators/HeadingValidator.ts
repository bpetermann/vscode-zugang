import { H1, H2, H3, H4, H5, H6 } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const LEVELS = [H1, H2, H3, H4, H5, H6] as const;

export class HeadingValidator implements RuleValidator {
  readonly tags: readonly string[] = LEVELS;
  private firstByLevel = new Map<string, AccessibilityNode>();

  reset(): void {
    this.firstByLevel = new Map();
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    if (node.name && !this.firstByLevel.has(node.name)) {
      this.firstByLevel.set(node.name, node);
    }
    if (!node.text.trim()) {
      return [{ message: messages.heading.blank, node }];
    }
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    for (let i = 1; i < LEVELS.length; i++) {
      const first = this.firstByLevel.get(LEVELS[i]);
      const prev = this.firstByLevel.get(LEVELS[i - 1]);
      if (first && !prev) {
        violations.push({ message: messages.heading.shouldExist, node: first });
      }
    }
    return violations;
  }
}
