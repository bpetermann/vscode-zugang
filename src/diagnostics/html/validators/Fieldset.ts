import { Element } from 'domhandler';
import { messages } from '../../utils/messages';
import { HTMLElement } from '../Element';
import ElementList from '../ElementList';
import { Validator, ValidatorError } from './Validator';

export class FieldsetValidator implements Validator {
  readonly #nodeTags = ['fieldset'] as const;

  get nodeTags() {
    return this.#nodeTags;
  }

  validate(domNodes: Element[]): ValidatorError[] {
    const errors: ValidatorError[] = [];

    const elementsList = new ElementList(domNodes);
    const { elements: fieldsets } = elementsList;

    fieldsets.forEach((fieldset) => {
      const childNode = HTMLElement.getFirstChild(fieldset);

      if (!(childNode && childNode.name === 'legend')) {
        errors.push(new ValidatorError(messages.fieldset.legend, fieldset));
      }
    });

    return errors;
  }
}
