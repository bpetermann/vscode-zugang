import { H1, HTML, MAIN, TITLE } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const UNIQUE_TAGS = [HTML, H1, MAIN, TITLE] as const;
type UniqueTag = (typeof UNIQUE_TAGS)[number];

export class UniquenessValidator implements RuleValidator {
  readonly tags: readonly string[] = UNIQUE_TAGS;
  private firstSeen = new Map<string, AccessibilityNode>();
  private counts = new Map<string, number>();

  reset(): void {
    this.firstSeen = new Map();
    this.counts = new Map();
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const name = node.name;
    if (!name) {
      return [];
    }
    if (!this.firstSeen.has(name)) {
      this.firstSeen.set(name, node);
    }
    this.counts.set(name, (this.counts.get(name) ?? 0) + 1);
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    this.counts.forEach((count, tag) => {
      if (count > 1) {
        violations.push({
          message: messages[tag as UniqueTag].shouldBeUnique,
          node: this.firstSeen.get(tag),
        });
      }
    });
    return violations;
  }
}
