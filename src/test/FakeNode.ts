import { AccessibilityNode, NodeLocation } from '../diagnostics/utils/AccessibilityNode';
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
} from '../diagnostics/utils/constants';

/**
 * Lightweight AccessibilityNode implementation for use in validator unit tests.
 * Construct with `name` and `attribs`, set `children` to build a tree.
 */
export class FakeNode implements AccessibilityNode {
  name: string | undefined;
  text: string = '';
  loc: NodeLocation | null | undefined = null;
  startIndex: number | undefined = undefined;
  endIndex: number | undefined = undefined;
  style: Record<string, string | number | boolean> = {};
  children: FakeNode[] = [];
  parent: FakeNode | undefined = undefined;
  previousElementSibling: FakeNode | undefined = undefined;
  nextElementSibling: FakeNode | undefined = undefined;
  private attribs: Record<string, string>;

  constructor(
    name?: string,
    attribs: Record<string, string> = {},
    children: FakeNode[] = []
  ) {
    this.name = name;
    this.attribs = attribs;
    this.children = children;
  }

  getAttribute(name: string): string | undefined {
    return this.attribs[name];
  }

  hasAttribute(name: string): boolean {
    return name in this.attribs;
  }

  getAttributes(): string[] {
    return Object.keys(this.attribs);
  }

  getChild(tag: string): FakeNode | undefined {
    return this.children.find((c) => c.name === tag);
  }

  getSequenceLength(): number {
    let node: FakeNode = this;
    let count = 1;
    while (true) {
      const first = node.children[0];
      if (!first || first.name !== this.name) {
        break;
      }
      node = first;
      count++;
    }
    return count;
  }

  getAbstractRole(): string | undefined {
    return ABSTRACT_ROLES.find((r) => r === this.attribs[ROLE]);
  }

  isNotFocusable(): boolean {
    const name = this.name ?? '';
    const isFormControl = ([INPUT, BUTTON, TEXTAREA, SELECT] as string[]).includes(name);
    const isLink = name === LINK;

    const rawTabIndex = this.attribs[TABINDEX];
    const tabIndexValue = rawTabIndex !== undefined ? +rawTabIndex : null;
    const hasNegativeTabIndex = tabIndexValue === -1;
    const hasPositiveTabIndex = tabIndexValue !== null && tabIndexValue > -1;

    const hasInert = INERT in this.attribs;
    const hasContentEditable = this.attribs[CONTENT_EDITABLE] === TRUE;
    const hasButtonRole = this.attribs[ROLE] === BUTTON;
    const hasHref = HREF in this.attribs;
    const isDisabled = DISABLED in this.attribs;

    return !(
      (isFormControl && !hasNegativeTabIndex && !isDisabled && !hasInert) ||
      (isLink && hasHref && !hasInert) ||
      hasContentEditable ||
      hasPositiveTabIndex ||
      (hasButtonRole && !hasNegativeTabIndex)
    );
  }

  canHaveAriaHidden(): boolean {
    if (!this.isNotFocusable()) {
      return false;
    }
    return this.children.every((child) => child.canHaveAriaHidden());
  }
}
