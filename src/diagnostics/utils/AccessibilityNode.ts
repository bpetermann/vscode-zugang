export interface NodeLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface AccessibilityNode {
  readonly name: string | undefined;
  readonly text: string;
  /** Canonical source position (1-indexed lines, 0-indexed columns). Populated by both adapters. */
  readonly loc: NodeLocation | null | undefined;
  readonly style: Record<string, string | number | boolean>;
  readonly children: readonly AccessibilityNode[];
  /** Parent element if known. */
  readonly parent: AccessibilityNode | undefined;
  /** Previous sibling element (skipping text/whitespace). */
  readonly previousElementSibling: AccessibilityNode | undefined;
  /** Next sibling element (skipping text/whitespace). */
  readonly nextElementSibling: AccessibilityNode | undefined;
  getAttribute(name: string): string | undefined;
  hasAttribute(name: string): boolean;
  getAttributes(): string[];
  getChild(tag: string): AccessibilityNode | undefined;
  getSequenceLength(): number;
  getAbstractRole(): string | undefined;
  isNotFocusable(): boolean;
  canHaveAriaHidden(): boolean;
}
