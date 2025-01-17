import {
  ARIA_CHECKED,
  ARIA_LABEL,
  ARIA_LABELLEDBY,
  BUTTON,
  IMG,
  ROLE,
  SWITCH,
  TITLE,
} from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class ButtonValidator implements Validator {
  #tags: string[] = [BUTTON];

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement): Diagnostic[] {
    return [
      this.checkSwitchRole(node),
      this.checkTextContent(node),
      this.checkAbsractRole(node),
    ].filter((error) => error instanceof Diagnostic);
  }

  checkSwitchRole(node: TSXElement): Diagnostic | undefined {
    if (
      node.getAttribute(ROLE) === SWITCH &&
      !node.hasAttribute(ARIA_CHECKED)
    ) {
      return new Diagnostic(messages.button.switch, node.loc);
    }
  }

  private checkTextContent(node: TSXElement): Diagnostic | undefined {
    const attributes = node.getAttributes();

    if (
      !node.text &&
      !node.getChild(IMG) &&
      !attributes.includes(ARIA_LABEL) &&
      !attributes.includes(ARIA_LABELLEDBY) &&
      !attributes.includes(TITLE)
    ) {
      return new Diagnostic(messages.button.text, node.loc);
    }
  }

  private checkAbsractRole(node: TSXElement): Diagnostic | undefined {
    const abstractRole = node.getAbstractRole();
    if (abstractRole) {
      return new Diagnostic(messages.button.abstract + abstractRole, node.loc);
    }
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validate(node);
  }
}
