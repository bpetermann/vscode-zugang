import { ALT, GENERIC_ALT, IMG } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const MAX_SAME_ALT = 3;

export class ImageValidator implements RuleValidator {
  readonly tags: readonly string[] = [IMG];
  private altCounts = new Map<string, AccessibilityNode>();
  private altOccurrences = new Map<string, number>();

  reset(): void {
    this.altCounts = new Map();
    this.altOccurrences = new Map();
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const alt = node.getAttribute(ALT);
    if (alt === undefined && !node.hasAttribute(ALT)) {
      return [{ message: messages.img.alt }];
    }
    if (alt) {
      if (!this.altCounts.has(alt)) {
        this.altCounts.set(alt, node);
      }
      this.altOccurrences.set(alt, (this.altOccurrences.get(alt) ?? 0) + 1);
      if (alt.split(' ').some((t) => GENERIC_ALT.includes(t))) {
        return [{ message: messages.img.generic + alt }];
      }
    }
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    this.altOccurrences.forEach((count, alt) => {
      if (count > MAX_SAME_ALT) {
        violations.push({
          message: messages.img.repeated,
          node: this.altCounts.get(alt),
        });
      }
    });
    return violations;
  }
}
