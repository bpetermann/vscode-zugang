import { DiagnosticSeverity } from 'vscode';
import {
  ARIA_CURRENT,
  GENERIC_TEXTS,
  HREF,
  LINK,
  ONCLICK,
} from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const MAX_SEQUENCE_LENGTH = 5;
const GENERICS = new Set(GENERIC_TEXTS);

export class LinkValidator implements RuleValidator {
  readonly tags: readonly string[] = [LINK];
  private links: AccessibilityNode[] = [];
  private anyHasAriaCurrent = false;

  reset(): void {
    this.links = [];
    this.anyHasAriaCurrent = false;
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    this.links.push(node);
    if (node.hasAttribute(ARIA_CURRENT)) {
      this.anyHasAriaCurrent = true;
    }

    const violations: RuleViolation[] = [];

    const text = node.text;
    if (text && GENERICS.has(text.toLowerCase().trim())) {
      violations.push({ message: `${messages.link.generic}"${text}"` });
    }

    if (node.hasAttribute(ONCLICK)) {
      violations.push({ message: messages.link.onclick });
    }

    const href = node.getAttribute(HREF);
    if (href?.startsWith('mailto:') && !text?.includes('@')) {
      violations.push({ message: messages.link.mail });
    }

    if (this.isChainHead(node) && this.chainLength(node) > MAX_SEQUENCE_LENGTH) {
      violations.push({
        message: messages.link.list,
        severity: DiagnosticSeverity.Hint,
      });
    }

    return violations;
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    if (this.links.length <= 1 || this.anyHasAriaCurrent) {
      return [];
    }
    return [
      {
        message: messages.link.current,
        severity: DiagnosticSeverity.Hint,
        node: this.links[0],
      },
    ];
  }

  private isChainHead(node: AccessibilityNode): boolean {
    return node.previousElementSibling?.name !== LINK;
  }

  private chainLength(node: AccessibilityNode): number {
    let count = 1;
    let next = node.nextElementSibling;
    while (next?.name === LINK) {
      count++;
      next = next.nextElementSibling;
    }
    return count;
  }
}
