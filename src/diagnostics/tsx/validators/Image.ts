import { ALT, GENERIC_ALT, IMG } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class ImageValidator implements Validator {
  #tags = [IMG];

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement): Diagnostic[] {
    return [this.checkAltExists(node), this.checkAltText(node)].filter(
      (error) => error instanceof Diagnostic
    );
  }

  checkAltExists(node: TSXElement) {
    if (!node.hasAttribute(ALT)) {
      return new Diagnostic(messages.img.alt, node.loc);
    }
  }

  checkAltText(node: TSXElement) {
    const altText = node.getAttribute(ALT);
    const hasGenericAlt = altText
      ?.split(' ')
      .some((text) => GENERIC_ALT.includes(text));
    if (altText && hasGenericAlt) {
      return new Diagnostic(messages.img.generic + altText, node.loc);
    }
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validateImage(node);
  }
}
