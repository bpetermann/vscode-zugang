import { Element } from 'domhandler';
import {
  ABSTRACT_ROLES,
  BUTTON,
  CONTENT_EDITABLE,
  DISABLED,
  HREF,
  INERT,
  INPUT,
  LINK,
  ROLE,
  SELECT,
  TABINDEX,
  TEXTAREA,
  TRUE,
} from '../utils/constants';

export class HTMLElement {
  /**
   * Extracts inline CSS styles from an HTML element and converts them into a key-value object.
   *
   * @param {Element} element - The HTML element to extract styles from.
   * @returns {Record<string, string>} An object where keys are CSS property names and values are their corresponding styles.
   */

  static getStyles(element: Element): { [k: string]: string } {
    const { style } = element.attribs;
    const styles: { [key: string]: string } = {};

    if (!style) {
      return styles;
    }

    style.split(';').map((style) => {
      const [key, value] = style.split(':').map((s) => s.trim());
      styles[key] = value;
    });

    return styles;
  }

  /**
   * Returns the first child element of the given element.
   * @param {Element} element - The parent element from which to retrieve the first child.
   * @returns {Element | undefined} - The first child element, or `undefined` if none exists.
   */
  static getFirstChild(element: Element): Element | undefined {
    return element.children.find((childNode) => childNode instanceof Element);
  }

  /**
   * Returns the first sibling after before the given element.
   * @param {Element} element - The element whose next sibling is being sought.
   * @returns {Element | undefined} The next sibling element, or `undefined` if none exists.
   */
  static getFirstSibling(element: Element): Element | undefined {
    let nextNode = element.next;

    while (nextNode && !(nextNode instanceof Element)) {
      nextNode = nextNode.next;
    }

    return nextNode instanceof Element ? nextNode : undefined;
  }

  /**
   * Returns the first sibling element before the given element.
   * @param {Element} element - The element whose previous sibling is being sought.
   * @returns {Element | undefined} The first sibling element, or `undefined` if none exists.
   */
  static getPrevSibling(element: Element): Element | undefined {
    let prevNode = element.prev;

    while (prevNode && !(prevNode instanceof Element)) {
      prevNode = prevNode.prev;
    }

    return prevNode instanceof Element ? prevNode : undefined;
  }

  /**
   * Checks if the given element has an abstract role attached.
   * @param {Element} element - The element to check.
   * @returns {string | undefined} The role of the element, if it is abstract.
   */
  static getAbsractRole(element: Element): string | undefined {
    return ABSTRACT_ROLES.find((role) => role === element.attribs[ROLE]);
  }

  /**
   * Determines whether an Element and all of its child elements.
   * can safely have the `aria-hidden` attribute applied.
   *
   * @param {Element} element - The Element to check.
   * @returns {boolean} `true` if the element and all its child elements can have `aria-hidden`; otherwise, `false`.
   */
  static canHaveAriaHidden(element: Element): boolean {
    if (!HTMLElement.isNotFocusable(element)) {
      return false;
    }

    const childElements = element.children.filter(
      (child) => child instanceof Element
    );

    return childElements.every((child) => this.canHaveAriaHidden(child));
  }

  static isNotFocusable(node: Element): boolean {
    const isFormControl = (
      [INPUT, BUTTON, TEXTAREA, SELECT] as string[]
    ).includes(node.name);
    const isLink = node.name === LINK;

    const hasTabIndex = node.attribs?.[TABINDEX];
    const tabIndexValue = hasTabIndex !== undefined ? +hasTabIndex : null;
    const hasNegativeTabIndex = tabIndexValue === -1;
    const hasPositiveTabIndex = tabIndexValue !== null && tabIndexValue > -1;

    const hasInert = node.attribs?.[INERT] !== undefined;
    const hasContentEditable = node.attribs?.[CONTENT_EDITABLE] === TRUE;
    const hasButtonRole = node.attribs?.[ROLE] === BUTTON;
    const hasHref = node.attribs?.[HREF] !== undefined;
    const isDisabled = node.attribs?.[DISABLED] !== undefined;

    return !(
      (isFormControl && !hasNegativeTabIndex && !isDisabled && !hasInert) ||
      (isLink && hasHref && !hasInert) ||
      hasContentEditable ||
      hasPositiveTabIndex ||
      (hasButtonRole && !hasNegativeTabIndex)
    );
  }
}
