import * as jsx from '@babel/types';
import {
  ABSTRACT_ROLES,
  BUTTON,
  CONTENT_EDITABLE,
  DISABLED,
  EXPRESSION,
  HREF,
  INERT,
  INPUT,
  JSX_ATTRIBUTE,
  JSX_ELEMENT,
  JSX_FRAGMENT,
  JSX_IDENTIFIER,
  JSX_MEMBER_EXPRESSION,
  JSX_TEXT,
  LINK,
  NAME,
  OBJECT_EXPRESSION,
  OBJECT_PROPERTY,
  ROLE,
  SELECT,
  STRING_LITERAL,
  TABINDEX,
  TEXTAREA,
  TRUE,
  VALUE,
} from '../utils/constants';

export class TSXElement {
  constructor(private node: jsx.JSXElement) {}

  /**
   * Extracts inline CSS styles from an TSXElement and converts them into a key-value object.
   * @returns {Record<string, string>} An object where keys are CSS property names and values are their corresponding styles.
   */
  get style(): { [key: string]: string | number | boolean } {
    const styles: { [key: string]: string | number | boolean } = {};

    const style = this.node.openingElement.attributes.find(
      (attr) => attr.type === JSX_ATTRIBUTE && attr.name.name === 'style'
    );

    if (
      style &&
      VALUE in style &&
      EXPRESSION in style[VALUE]! &&
      style[VALUE][EXPRESSION].type === OBJECT_EXPRESSION
    ) {
      style.value.expression.properties.map((style) => {
        if (style.type !== OBJECT_PROPERTY) {
          return;
        }

        const { key, value } = style;

        if (NAME in key && VALUE in value) {
          styles[key.name] = value.value;
        }
      });
    }

    return styles;
  }

  /**
   * Retrieves the source location of the JSX element.
   */
  get loc(): jsx.SourceLocation | null | undefined {
    return this.node.loc;
  }

  /**
   * Retrieves the string name of the JSX element.
   * @returns {string | undefined} The name of the JSX element, or undefined if it cannot be determined.
   */
  get name(): string | undefined {
    const node = this.node.openingElement;
    switch (node.name.type) {
      case JSX_IDENTIFIER:
        return node.name.name;
      case JSX_MEMBER_EXPRESSION:
        return this.getMemberExpressionName(node.name);
      default:
        return `${node.name?.namespace?.name}:${node.name?.name?.name}`;
    }
  }

  /**
   * Retrieves the text content of the first text child in the JSX element.
   * @returns {string} The text content, or an empty string if no text child is found.
   */
  get text(): string {
    return (
      (this.node.children.find(({ type }) => type === JSX_TEXT) as jsx.JSXText)
        ?.value ?? ''
    );
  }

  get children() {
    return this.node.children;
  }

  get element() {
    return this.node;
  }

  /**
   * Calculates the length of consecutive elements with the same tag.
   * @returns {number} The number of consecutive elements with the same tag.
   */
  getSeuqenceLength(): number {
    let element = this.node;
    let sum = 1;

    while (this.nextchildHasTag(element, this.name)) {
      element = this.getFirstChild(element)!;
      sum++;
    }

    return sum;
  }

  /**
   * Finds a direct child element with a specific tag name.
   * @param {string} tag - The tag name to search for.
   * @returns {jsx.JSXElement | undefined} The child JSX element with the specified tag, or undefined if not found.
   */
  getChild(tag: string): jsx.JSXElement | undefined {
    return this.node.children.find(
      (child) =>
        child.type === JSX_ELEMENT &&
        NAME in child.openingElement.name &&
        child.openingElement.name.name === tag
    ) as jsx.JSXElement;
  }

  /**
   * Checks if the JSX element has a specified attribute.
   * @param {string | jsx.JSXIdentifier} attribute - The attribute name to check.
   * @returns {boolean} True if the attribute is present, otherwise false.
   */
  hasAttribute(attribute: string | jsx.JSXIdentifier): boolean {
    return this.node.openingElement.attributes.some(
      (attr) => attr.type === JSX_ATTRIBUTE && attr.name.name === attribute
    );
  }

  /**
   * Retrieves a list of attribute names from the JSX element.
   * @returns {string[]} An array of attribute names.
   */
  getAttributes(): string[] {
    return this.node.openingElement.attributes
      .map((attr) => {
        if (attr.type === JSX_ATTRIBUTE && attr.name.type === JSX_IDENTIFIER) {
          return attr.name.name;
        }
      })
      .filter((attr) => typeof attr === 'string');
  }

  /**
   * Retrieves the value of a specific attribute from the JSX element.
   * @param {string | jsx.JSXIdentifier} attribute - The attribute name to retrieve the value for.
   * @returns {string | undefined} The value of the attribute, or undefined if not found.
   */
  getAttribute(attribute: string | jsx.JSXIdentifier): string | undefined {
    const jsxAttribute = this.node.openingElement.attributes.find(
      (attr) => attr.type === JSX_ATTRIBUTE && attr.name.name === attribute
    );
    if (
      jsxAttribute &&
      VALUE in jsxAttribute &&
      jsxAttribute[VALUE]?.type === STRING_LITERAL
    ) {
      return jsxAttribute.value.value;
    }
  }

  /**
   * Checks if the given element has an abstract role attached.
   * @returns {string | undefined} The role of the element, if it is abstract, or undefined.
   */
  getAbstractRole(): string | undefined {
    return ABSTRACT_ROLES.find((role) => role === this.getAttribute(ROLE));
  }

  /**
   * Checks if the next child element has the same tag name as the current element.
   * @private
   * @param {jsx.JSXElement} element - The current JSX element.
   * @param {string | undefined} tag - The tag name to check for.
   * @returns {boolean} True if the next child element has the same tag, otherwise false.
   */
  private nextchildHasTag(
    element: jsx.JSXElement,
    tag: string | undefined
  ): boolean {
    if (!tag) {
      return false;
    }

    const child = this.getFirstChild(element);
    return (
      !!child &&
      NAME in child.openingElement.name &&
      child.openingElement.name.name === tag
    );
  }

  /**
   * Retrieves the string name from a JSX MemberExpression.
   * @private
   * @param {jsx.JSXMemberExpression} elementName - The JSX MemberExpression node.
   * @returns {string | undefined} The full name of the member expression, or undefined if it cannot be determined.
   */
  private getMemberExpressionName(
    elementName: jsx.JSXMemberExpression
  ): string | undefined {
    const { object, property } = elementName;
    if (object.type !== JSX_IDENTIFIER || property.type !== JSX_IDENTIFIER) {
      return undefined;
    }
    return `${object.name}.${property.name}`;
  }

  /**
   * Retrieves the first child element that is a JSXElement.
   * @private
   * @param {jsx.JSXElement} element - The parent JSX element.
   * @returns {jsx.JSXElement | undefined} The first child JSX element, or undefined if not found.
   */
  private getFirstChild(element: jsx.JSXElement): jsx.JSXElement | undefined {
    return element.children.find((child) => child.type === JSX_ELEMENT);
  }

  /**
   * Determines whether an Element and all of its child elements
   * can safely have the `aria-hidden` attribute applied.
   *
   * @param {jsx.JSXElement} element - The JSX element to check.
   * @returns {boolean} `true` if the element and all its child elements can have `aria-hidden`; otherwise, `false`.
   */
  static canHaveAriaHidden(element: jsx.JSXElement): boolean {
    if (!TSXElement.isNotFocusable(element)) {
      return false;
    }

    const getChildElements = (
      element: jsx.JSXElement | jsx.JSXFragment
    ): jsx.JSXElement[] => {
      return element.children.flatMap((child) => {
        if (child.type === JSX_ELEMENT) {
          return child;
        } else if (child.type === JSX_FRAGMENT) {
          return getChildElements(child);
        } else {
          return [];
        }
      });
    };

    const childElements = getChildElements(element);
    return childElements.every((child) => TSXElement.canHaveAriaHidden(child));
  }

  static isNotFocusable(node: jsx.JSXElement): boolean {
    const isIdentifier = node.openingElement.name.type === JSX_IDENTIFIER;
    const asIdentifier = node.openingElement.name as jsx.JSXIdentifier;

    const formElements: string[] = [INPUT, BUTTON, TEXTAREA, SELECT];
    const isFormControl =
      isIdentifier && formElements.includes(asIdentifier.name);

    const isLink = isIdentifier && asIdentifier.name === LINK;

    const allAttributes = node.openingElement.attributes.filter(
      (attr) => attr.type === JSX_ATTRIBUTE
    );

    const getAttributeValue = (attrName: string): string | undefined =>
      (
        allAttributes.find(
          ({ name, value }) =>
            name.name === attrName && value?.type === STRING_LITERAL
        )?.value as jsx.StringLiteral
      )?.value;

    const hasTabIndex = getAttributeValue(TABINDEX);
    const tabIndexValue = hasTabIndex !== undefined ? +hasTabIndex : null;
    const hasNegativeTabIndex = tabIndexValue === -1;
    const hasPositiveTabIndex = tabIndexValue !== null && tabIndexValue > -1;

    const hasInert = getAttributeValue(INERT) !== undefined;
    const hasContentEditable = getAttributeValue(CONTENT_EDITABLE) === TRUE;
    const hasButtonRole = getAttributeValue(ROLE) === BUTTON;
    const hasHref = getAttributeValue(HREF) !== undefined;
    const isDisabled = getAttributeValue(DISABLED) !== undefined;

    return !(
      (isFormControl && !hasNegativeTabIndex && !isDisabled && !hasInert) ||
      (isLink && hasHref && !hasInert) ||
      hasContentEditable ||
      hasPositiveTabIndex ||
      (hasButtonRole && !hasNegativeTabIndex)
    );
  }
}
