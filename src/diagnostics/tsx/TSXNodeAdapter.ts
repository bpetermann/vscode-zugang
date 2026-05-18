import * as jsx from '@babel/types';
import {
  ABSTRACT_ROLES,
  BUTTON,
  CONTENT_EDITABLE,
  DISABLED,
  HREF,
  INERT,
  INPUT,
  JSX_ATTRIBUTE,
  JSX_ELEMENT,
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
  EXPRESSION,
} from '../utils/constants';
import { AccessibilityNode, NodeLocation } from '../utils/AccessibilityNode';

export class TSXNodeAdapter implements AccessibilityNode {
  constructor(private node: jsx.JSXElement) {}

  /**
   * Tag name of the JSX element. Returns `"Foo.Bar"` for member expressions,
   * `"ns:local"` for namespaced names, or `undefined` if the type is unrecognised.
   */
  get name(): string | undefined {
    const { name } = this.node.openingElement;
    switch (name.type) {
      case JSX_IDENTIFIER:
        return name.name;
      case JSX_MEMBER_EXPRESSION: {
        const { object, property } = name;
        if (
          object.type !== JSX_IDENTIFIER ||
          property.type !== JSX_IDENTIFIER
        ) {
          return undefined;
        }
        return `${object.name}.${property.name}`;
      }
      default:
        return `${(name as jsx.JSXNamespacedName).namespace?.name}:${(name as jsx.JSXNamespacedName).name?.name}`;
    }
  }

  /** Text content of the first direct JSXText child, or an empty string. */
  get text(): string {
    const child = this.node.children.find(
      ({ type }) => type === JSX_TEXT
    ) as jsx.JSXText | undefined;
    return child?.value ?? '';
  }

  /** Source location (1-indexed lines) from the Babel AST, or `null`/`undefined` if unavailable. */
  get loc(): NodeLocation | null | undefined {
    const l = this.node.loc;
    if (!l) {
      return l;
    }
    return {
      start: { line: l.start.line, column: l.start.column },
      end: { line: l.end.line, column: l.end.column },
    };
  }

  /** Always `undefined` for TSX nodes — use `loc` for position. */
  get startIndex(): undefined {
    return undefined;
  }

  /** Always `undefined` for TSX nodes — use `loc` for position. */
  get endIndex(): undefined {
    return undefined;
  }

  /** Inline styles parsed from the JSX object-literal `style` prop into a key/value record. */
  get style(): Record<string, string | number | boolean> {
    const styles: Record<string, string | number | boolean> = {};
    const styleAttr = this.node.openingElement.attributes.find(
      (attr) =>
        attr.type === JSX_ATTRIBUTE &&
        (attr as jsx.JSXAttribute).name.name === 'style'
    ) as jsx.JSXAttribute | undefined;

    if (
      styleAttr &&
      VALUE in styleAttr &&
      styleAttr.value &&
      EXPRESSION in styleAttr.value &&
      (styleAttr.value as jsx.JSXExpressionContainer).expression.type ===
        OBJECT_EXPRESSION
    ) {
      const expr = (styleAttr.value as jsx.JSXExpressionContainer)
        .expression as jsx.ObjectExpression;
      expr.properties.forEach((prop) => {
        if (prop.type !== OBJECT_PROPERTY) {
          return;
        }
        const { key, value } = prop as jsx.ObjectProperty;
        if (NAME in key && VALUE in value) {
          styles[(key as jsx.Identifier).name] = (
            value as jsx.StringLiteral | jsx.NumericLiteral | jsx.BooleanLiteral
          ).value;
        }
      });
    }
    return styles;
  }

  /** Direct child JSXElements (text, fragments and expressions excluded), each wrapped as an `AccessibilityNode`. */
  get children(): readonly AccessibilityNode[] {
    return this.node.children
      .filter((c) => c.type === JSX_ELEMENT)
      .map((c) => new TSXNodeAdapter(c as jsx.JSXElement));
  }

  /**
   * Returns the string value of the named attribute if it is a string literal, otherwise `undefined`.
   * Expression values (e.g. `tabIndex={0}`) are not returned.
   */
  getAttribute(name: string): string | undefined {
    const attr = this.node.openingElement.attributes.find(
      (a) =>
        a.type === JSX_ATTRIBUTE &&
        (a as jsx.JSXAttribute).name.name === name
    ) as jsx.JSXAttribute | undefined;
    if (attr?.value?.type === STRING_LITERAL) {
      return (attr.value as jsx.StringLiteral).value;
    }
  }

  /** Returns `true` if the named attribute is present, regardless of value type. */
  hasAttribute(name: string): boolean {
    return this.node.openingElement.attributes.some(
      (a) =>
        a.type === JSX_ATTRIBUTE &&
        (a as jsx.JSXAttribute).name.name === name
    );
  }

  /** Returns all JSXIdentifier attribute names on this element. */
  getAttributes(): string[] {
    return this.node.openingElement.attributes
      .filter(
        (a) =>
          a.type === JSX_ATTRIBUTE &&
          (a as jsx.JSXAttribute).name.type === JSX_IDENTIFIER
      )
      .map((a) => ((a as jsx.JSXAttribute).name as jsx.JSXIdentifier).name);
  }

  /** Returns the first direct child JSXElement with the given tag name, or `undefined`. */
  getChild(tag: string): AccessibilityNode | undefined {
    const child = this.node.children.find(
      (c) =>
        c.type === JSX_ELEMENT &&
        NAME in (c as jsx.JSXElement).openingElement.name &&
        ((c as jsx.JSXElement).openingElement.name as jsx.JSXIdentifier)
          .name === tag
    ) as jsx.JSXElement | undefined;
    return child ? new TSXNodeAdapter(child) : undefined;
  }

  /** Counts how many consecutive same-tag elements are nested directly inside each other. */
  getSequenceLength(): number {
    let el = this.node;
    let count = 1;
    while (true) {
      const first = el.children.find(
        (c) => c.type === JSX_ELEMENT
      ) as jsx.JSXElement | undefined;
      if (!first) {
        break;
      }
      const childName =
        first.openingElement.name.type === JSX_IDENTIFIER
          ? first.openingElement.name.name
          : undefined;
      if (childName !== this.name) {
        break;
      }
      el = first;
      count++;
    }
    return count;
  }

  /** Returns the element's `role` value if it is an abstract ARIA role, otherwise `undefined`. */
  getAbstractRole(): string | undefined {
    return ABSTRACT_ROLES.find((r) => r === this.getAttribute(ROLE));
  }

  /**
   * Returns `true` when the element cannot receive keyboard focus.
   * Accounts for form controls, links, tabindex, inert, disabled, contenteditable, and button role.
   */
  isNotFocusable(): boolean {
    const isIdentifier =
      this.node.openingElement.name.type === JSX_IDENTIFIER;
    const asIdentifier = this.node.openingElement.name as jsx.JSXIdentifier;

    const isFormControl =
      isIdentifier &&
      ([INPUT, BUTTON, TEXTAREA, SELECT] as string[]).includes(asIdentifier.name);
    const isLink = isIdentifier && asIdentifier.name === LINK;

    const rawTabIndex = this.getAttribute(TABINDEX);
    const tabIndexValue = rawTabIndex !== undefined ? +rawTabIndex : null;
    const hasNegativeTabIndex = tabIndexValue === -1;
    const hasPositiveTabIndex = tabIndexValue !== null && tabIndexValue > -1;

    const hasInert = this.hasAttribute(INERT);
    const hasContentEditable = this.getAttribute(CONTENT_EDITABLE) === TRUE;
    const hasButtonRole = this.getAttribute(ROLE) === BUTTON;
    const hasHref = this.hasAttribute(HREF);
    const isDisabled = this.hasAttribute(DISABLED);

    return !(
      (isFormControl && !hasNegativeTabIndex && !isDisabled && !hasInert) ||
      (isLink && hasHref && !hasInert) ||
      hasContentEditable ||
      hasPositiveTabIndex ||
      (hasButtonRole && !hasNegativeTabIndex)
    );
  }

  /**
   * Returns `true` if this element and all its descendants can safely receive `aria-hidden`.
   * Any focusable element in the subtree causes this to return `false`.
   */
  canHaveAriaHidden(): boolean {
    if (!this.isNotFocusable()) {
      return false;
    }
    return this.children.every((child) => child.canHaveAriaHidden());
  }
}
