import { DiagnosticSeverity } from 'vscode';
import { META, TITLE } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

const REQUIRED_TAGS = [META, TITLE] as const;
type RequiredTag = (typeof REQUIRED_TAGS)[number];

export class RequiredValidator implements RuleValidator {
  readonly tags: readonly string[] = REQUIRED_TAGS;
  private seen = new Set<string>();

  reset(): void {
    this.seen = new Set();
  }

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    if (node.name) {
      this.seen.add(node.name);
    }
    return [];
  }

  finalize(_context: ValidationContext): RuleViolation[] {
    return REQUIRED_TAGS.filter((tag) => !this.seen.has(tag)).map<RuleViolation>(
      (tag) => ({
        message: messages[tag as RequiredTag].shouldExist,
        severity: DiagnosticSeverity.Error,
      })
    );
  }
}
