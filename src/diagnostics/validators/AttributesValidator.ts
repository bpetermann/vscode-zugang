import { HTML, LANG, META, NAME } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const REQUIRED: Record<string, string[]> = {
  [HTML]: [LANG],
  [META]: [NAME],
};

type ReqTag = typeof HTML | typeof META;

export class AttributesValidator implements RuleValidator {
  readonly tags: readonly string[] = [HTML, META];
  private seen = new Map<string, AccessibilityNode[]>();

  reset(): void {
    this.seen = new Map();
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    if (!node.name) {
      return [];
    }
    const bucket = this.seen.get(node.name) ?? [];
    bucket.push(node);
    this.seen.set(node.name, bucket);
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    const violations: RuleViolation[] = [];
    this.tags.forEach((tag) => {
      const nodes = this.seen.get(tag);
      if (!nodes?.length) {
        return;
      }
      const requiredAttrs = REQUIRED[tag];
      const satisfied = requiredAttrs.every((attr) =>
        nodes.some((n) => n.getAttribute(attr))
      );
      if (!satisfied) {
        violations.push({
          message: messages[tag as ReqTag].hasMissingAttribute,
          node: nodes[0],
        });
      }
    });
    return violations;
  }
}
