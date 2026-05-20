import * as jsx from '@babel/types';
import { AccessibilityNode, NodeLocation } from '../utils/AccessibilityNode';
import {
  ABSTRACT_ROLES,
  BOOLEAN_LITERAL,
  BUTTON,
  CONTENT_EDITABLE,
  DISABLED,
  EXPRESSION,
  HREF,
  INERT,
  INPUT,
  JSX_ATTRIBUTE,
  JSX_ELEMENT,
  JSX_EXPRESSION_CONTAINER,
  JSX_FRAGMENT,
  JSX_IDENTIFIER,
  JSX_MEMBER_EXPRESSION,
  JSX_TEXT,
  LINK,
  NAME,
  NUMERIC_LITERAL,
  OBJECT_EXPRESSION,
  OBJECT_PROPERTY,
  ROLE,
  SELECT,
  STRING_LITERAL,
  TABINDEX,
  TEMPLATE_LITERAL,
  TEXTAREA,
  TRUE,
  VALUE,
} from '../utils/constants';

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
    const child = this.node.children.find(({ type }) => type === JSX_TEXT) as
      | jsx.JSXText
      | undefined;
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

  /**
   * Inline styles parsed from the JSX object-literal `style` prop into a key/value record.
   * Keys are normalised to kebab-case so HTML and TSX adapters share a vocabulary.
   */
  get style(): Record<string, string | number | boolean> {
    const styles: Record<string, string | number | boolean> = {};
    const styleAttr = this.node.openingElement.attributes.find(
      (attr) =>
        attr.type === JSX_ATTRIBUTE &&
        (attr as jsx.JSXAttribute).name.name === 'style',
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
          const camel = (key as jsx.Identifier).name;
          const kebab = camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
          styles[kebab] = (
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

  /** TSX adapter does not track parent — Babel traversal carries it separately. */
  get parent(): undefined {
    return undefined;
  }

  /** TSX adapter does not track siblings. */
  get previousElementSibling(): undefined {
    return undefined;
  }

  /** TSX adapter does not track siblings. */
  get nextElementSibling(): undefined {
    return undefined;
  }

  /**
   * Returns the string value of the named attribute when it can be statically determined:
   * - `foo="bar"` (StringLiteral)
   * - `foo={2}`, `foo={"bar"}`, `foo={true}` (JSXExpressionContainer wrapping a literal)
   *
   * Returns `undefined` for attributes whose runtime value cannot be read at lint
   * time (identifiers, calls, member expressions, template literals containing
   * expressions). Numeric values are returned as their `String()` form so callers
   * can keep using `+value` for coercion.
   *
   * Attribute names are matched case-insensitively so React-idiomatic spellings
   * (`tabIndex`) resolve against the shared HTML-spelling vocabulary
   * (`tabindex`) used by RuleValidators.
   */
  getAttribute(name: string): string | undefined {
    const attr = this.findAttribute(name);
    const value = attr?.value;
    if (!value) {
      return undefined;
    }
    if (value.type === STRING_LITERAL) {
      return (value as jsx.StringLiteral).value;
    }
    if (value.type === JSX_EXPRESSION_CONTAINER) {
      const expr = (value as jsx.JSXExpressionContainer).expression;
      if (expr.type === NUMERIC_LITERAL) {
        return String((expr as jsx.NumericLiteral).value);
      }
      if (expr.type === STRING_LITERAL) {
        return (expr as jsx.StringLiteral).value;
      }
      if (expr.type === BOOLEAN_LITERAL) {
        return String((expr as jsx.BooleanLiteral).value);
      }
      if (expr.type === TEMPLATE_LITERAL) {
        const tmpl = expr as jsx.TemplateLiteral;
        if (tmpl.expressions.length === 0 && tmpl.quasis.length === 1) {
          return tmpl.quasis[0].value.cooked;
        }
      }
    }
    return undefined;
  }

  /** Returns `true` if the named attribute is present, regardless of value type. */
  hasAttribute(name: string): boolean {
    return this.findAttribute(name) !== undefined;
  }

  private findAttribute(name: string): jsx.JSXAttribute | undefined {
    const lower = name.toLowerCase();
    return this.node.openingElement.attributes.find(
      (a) =>
        a.type === JSX_ATTRIBUTE &&
        typeof (a as jsx.JSXAttribute).name.name === 'string' &&
        ((a as jsx.JSXAttribute).name.name as string).toLowerCase() === lower,
    ) as jsx.JSXAttribute | undefined;
  }

  /** Returns all JSXIdentifier attribute names on this element. */
  getAttributes(): string[] {
    return this.node.openingElement.attributes
      .filter(
        (a) =>
          a.type === JSX_ATTRIBUTE &&
          (a as jsx.JSXAttribute).name.type === JSX_IDENTIFIER,
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
          .name === tag,
    ) as jsx.JSXElement | undefined;
    return child ? new TSXNodeAdapter(child) : undefined;
  }

  /** Counts how many consecutive same-tag elements are nested directly inside each other. */
  getSequenceLength(): number {
    let el = this.node;
    let count = 1;
    while (true) {
      const first = el.children.find((c) => c.type === JSX_ELEMENT) as
        | jsx.JSXElement
        | undefined;
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
    const isIdentifier = this.node.openingElement.name.type === JSX_IDENTIFIER;
    const asIdentifier = this.node.openingElement.name as jsx.JSXIdentifier;

    const isFormControl =
      isIdentifier &&
      ([INPUT, BUTTON, TEXTAREA, SELECT] as string[]).includes(
        asIdentifier.name,
      );
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
    return this.flattenedDescendantElements(this.node).every((child) =>
      new TSXNodeAdapter(child).canHaveAriaHidden(),
    );
  }

  /** Flattens direct JSXElement descendants, traversing through JSXFragment children. */
  private flattenedDescendantElements(
    element: jsx.JSXElement | jsx.JSXFragment,
  ): jsx.JSXElement[] {
    return element.children.flatMap((child) => {
      if (child.type === JSX_ELEMENT) {
        return [child];
      }
      if (child.type === JSX_FRAGMENT) {
        return this.flattenedDescendantElements(child);
      }
      return [];
    });
  }
}
