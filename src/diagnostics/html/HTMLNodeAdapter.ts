import { Element, Text } from 'domhandler';
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
import { AccessibilityNode } from '../utils/AccessibilityNode';

export class HTMLNodeAdapter implements AccessibilityNode {
  constructor(private element: Element) {}

  /** Tag name of the element (e.g. `"button"`, `"div"`). */
  get name(): string {
    return this.element.name;
  }

  /** Text content of the first direct text child, or an empty string. */
  get text(): string {
    const child = this.element.children.find((c) => c instanceof Text);
    return child ? (child as Text).data : '';
  }

  /** Always `null` for HTML nodes — use `startIndex`/`endIndex` for position. */
  get loc() {
    return null;
  }

  /** Character offset of the opening tag start, as reported by htmlparser2. */
  get startIndex(): number | undefined {
    return this.element.startIndex ?? undefined;
  }

  /** Character offset of the closing tag end, as reported by htmlparser2. */
  get endIndex(): number | undefined {
    return this.element.endIndex ?? undefined;
  }

  /** Inline CSS parsed from the `style` attribute into a key/value record. */
  get style(): Record<string, string> {
    const { style } = this.element.attribs;
    const result: Record<string, string> = {};
    if (!style) {
      return result;
    }
    style.split(';').forEach((s) => {
      const [key, value] = s.split(':').map((p) => p.trim());
      if (key && value !== undefined) {
        result[key] = value;
      }
    });
    return result;
  }

  /** Direct child elements (text nodes excluded), each wrapped as an `AccessibilityNode`. */
  get children(): readonly AccessibilityNode[] {
    return this.element.children
      .filter((c) => c instanceof Element)
      .map((c) => new HTMLNodeAdapter(c as Element));
  }

  /** Returns the value of the named attribute, or `undefined` if absent. */
  getAttribute(name: string): string | undefined {
    return this.element.attribs?.[name];
  }

  /** Returns `true` if the named attribute is present, regardless of value. */
  hasAttribute(name: string): boolean {
    return name in (this.element.attribs ?? {});
  }

  /** Returns all attribute names on this element. */
  getAttributes(): string[] {
    return Object.keys(this.element.attribs ?? {});
  }

  /** Returns the first direct child element with the given tag name, or `undefined`. */
  getChild(tag: string): AccessibilityNode | undefined {
    const child = this.element.children.find(
      (c) => c instanceof Element && (c as Element).name === tag
    );
    return child ? new HTMLNodeAdapter(child as Element) : undefined;
  }

  /** Counts how many consecutive same-tag elements are nested directly inside each other. */
  getSequenceLength(): number {
    let el: Element = this.element;
    let count = 1;
    while (true) {
      const first = el.children.find((c) => c instanceof Element) as
        | Element
        | undefined;
      if (!first || first.name !== this.name) {
        break;
      }
      el = first;
      count++;
    }
    return count;
  }

  /** Returns the element's `role` value if it is an abstract ARIA role, otherwise `undefined`. */
  getAbstractRole(): string | undefined {
    return ABSTRACT_ROLES.find((r) => r === this.element.attribs?.[ROLE]);
  }

  /**
   * Returns `true` when the element cannot receive keyboard focus.
   * Accounts for form controls, links, tabindex, inert, disabled, contenteditable, and button role.
   */
  isNotFocusable(): boolean {
    const { name } = this.element;
    const attribs = this.element.attribs ?? {};

    const isFormControl = (
      [INPUT, BUTTON, TEXTAREA, SELECT] as string[]
    ).includes(name);
    const isLink = name === LINK;

    const rawTabIndex = attribs[TABINDEX];
    const tabIndexValue = rawTabIndex !== undefined ? +rawTabIndex : null;
    const hasNegativeTabIndex = tabIndexValue === -1;
    const hasPositiveTabIndex = tabIndexValue !== null && tabIndexValue > -1;

    const hasInert = INERT in attribs;
    const hasContentEditable = attribs[CONTENT_EDITABLE] === TRUE;
    const hasButtonRole = attribs[ROLE] === BUTTON;
    const hasHref = HREF in attribs;
    const isDisabled = DISABLED in attribs;

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
