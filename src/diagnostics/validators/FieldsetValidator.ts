import { FIELDSET, LEGEND } from '../utils/constants';
import { messages } from '../utils/messages';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class FieldsetValidator implements RuleValidator {
  readonly tags: readonly string[] = [FIELDSET];

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    if (node.children[0]?.name !== LEGEND) {
      return [{ message: messages.fieldset.legend }];
    }
    return [];
  }
}
