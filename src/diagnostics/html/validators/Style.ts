import { Element } from 'domhandler';
import { isRatioOk } from 'hue-check';
import {
  BG_COLOR,
  BUTTON,
  DIV,
  FOOTER,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  HEADER,
  LINK,
  NAV,
  PARAGRAPH,
  SECTION,
} from '../../utils/constants';
import { messages } from '../../utils/messages';
import { HTMLElement } from '../Element';
import { Validator, ValidatorError } from './Validator';

export class StyleValidator implements Validator {
  readonly #nodeTags = [
    DIV,
    BUTTON,
    SECTION,
    PARAGRAPH,
    HEADER,
    FOOTER,
    LINK,
    NAV,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
  ];

  get nodeTags() {
    return this.#nodeTags;
  }

  validate(nodes: Element[]): ValidatorError[] {
    const errors: (ValidatorError | undefined)[] = [];

    nodes.forEach((element) => {
      const style = HTMLElement.getStyles(element);

      if (Object.keys(style).length) {
        errors.push(this.checkContrast(style, element));
      }
    });

    return errors.filter((error) => error instanceof ValidatorError);
  }

  checkContrast(
    style: {
      [k: string]: string;
    },
    element: Element
  ): ValidatorError | undefined {
    if (
      !style[BG_COLOR] ||
      !style.color ||
      isRatioOk(style[BG_COLOR], style.color)
    ) {
      return;
    }

    return new ValidatorError(messages.style.color, element);
  }
}
