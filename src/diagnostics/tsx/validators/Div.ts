import { DiagnosticSeverity } from 'vscode';
import {
  ARIA_EXPANDED,
  ARIA_HIDDEN,
  BUTTON,
  DIV,
  ONCLICK,
  ROLE,
  TRUE,
} from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class DivValidator implements Validator {
  #tags: string[] = [DIV];
  private maxSequenceLength: number = 5;

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement): Diagnostic[] {
    return [
      this.checkSequenceLength(node),
      this.checkButtonRole(node),
      this.checkWrongAttibutes(node),
      this.checkAriaHidden(node),
      this.checkAbsractRole(node),
    ].filter((error) => error instanceof Diagnostic);
  }

  private checkSequenceLength(node: TSXElement): Diagnostic | undefined {
    if (node.getSeuqenceLength() >= this.maxSequenceLength) {
      return new Diagnostic(
        messages.div.soup,
        node.loc,
        DiagnosticSeverity.Information
      );
    }
  }

  private checkButtonRole(node: TSXElement): Diagnostic | undefined {
    if (
      node.getAttributes().includes(ONCLICK) ||
      node.getAttribute(ROLE) === BUTTON
    ) {
      return new Diagnostic(
        messages.div.button,
        node.loc,
        DiagnosticSeverity.Information
      );
    }
  }

  private checkWrongAttibutes(node: TSXElement): Diagnostic | undefined {
    if (node.getAttribute(ARIA_EXPANDED) !== undefined) {
      return new Diagnostic(
        messages.div.expanded,
        node.loc,
        DiagnosticSeverity.Hint
      );
    }
  }

  private checkAriaHidden(node: TSXElement): Diagnostic | undefined {
    if (
      node.getAttribute(ARIA_HIDDEN) === TRUE &&
      !TSXElement.canHaveAriaHidden(node.element)
    ) {
      return new Diagnostic(messages.div[ARIA_HIDDEN], node.loc);
    }
  }

  private checkAbsractRole(node: TSXElement): Diagnostic | undefined {
    const abstractRole = node.getAbstractRole();
    if (abstractRole) {
      return new Diagnostic(messages.div.abstract + abstractRole, node.loc);
    }
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validate(node);
  }
}
