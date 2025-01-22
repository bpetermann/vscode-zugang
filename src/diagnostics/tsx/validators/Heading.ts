import { H1, H2, H3, H4, H5, H6 } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class HeadingValidator implements Validator {
  #tags: string[] = [H1, H2, H3, H4, H5, H6];

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement, elements: string[]): Diagnostic[] {
    return [
      this.checkMultipleH1(node, elements),
      this.checkEmptyHeading(node),
    ].filter((error) => error instanceof Diagnostic);
  }

  checkMultipleH1(
    node: TSXElement,
    elements: string[]
  ): Diagnostic | undefined {
    if (node.name === H1 && elements.includes(H1)) {
      return new Diagnostic(messages.heading.unique, node.loc);
    }
  }

  checkEmptyHeading(node: TSXElement): Diagnostic | undefined {
    if (!node.text) {
      return new Diagnostic(messages.heading.blank, node.loc);
    }
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validate(node);
  }
}
