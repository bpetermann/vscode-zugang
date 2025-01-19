import { GENERIC_TEXTS, HREF, LINK, ONCLICK } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class LinkValidator implements Validator {
  #tags: string[] = [LINK];

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement): Diagnostic[] {
    return [
      this.checkGenericText(node),
      this.checkWrongAttributes(node),
      this.checkMailToLinks(node),
    ].filter((error) => error instanceof Diagnostic);
  }

  checkGenericText(link: TSXElement): Diagnostic | undefined {
    if (GENERIC_TEXTS.includes(link.text.trim().toLowerCase())) {
      return new Diagnostic(messages.link.generic + link.text, link.loc);
    }
  }

  checkWrongAttributes(link: TSXElement): Diagnostic | undefined {
    if (link.getAttributes().includes(ONCLICK)) {
      return new Diagnostic(messages.link.onclick, link.loc);
    }
  }

  private checkMailToLinks(link: TSXElement): Diagnostic | undefined {
    const urlFragment = link.getAttribute(HREF);
    if (
      urlFragment &&
      urlFragment.startsWith('mailto:') &&
      !link.text?.includes('@')
    ) {
      return new Diagnostic(messages.link.mail, link.loc);
    }
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validate(node);
  }
}
