export interface NodeLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface AccessibilityNode {
  readonly name: string | undefined;
  readonly text: string;
  /** Line/column location (1-indexed lines). Undefined for HTML nodes — use startIndex/endIndex instead. */
  readonly loc: NodeLocation | null | undefined;
  readonly startIndex: number | undefined;
  readonly endIndex: number | undefined;
  readonly style: Record<string, string | number | boolean>;
  readonly children: readonly AccessibilityNode[];
  getAttribute(name: string): string | undefined;
  hasAttribute(name: string): boolean;
  getAttributes(): string[];
  getChild(tag: string): AccessibilityNode | undefined;
  getSequenceLength(): number;
  getAbstractRole(): string | undefined;
  isNotFocusable(): boolean;
  canHaveAriaHidden(): boolean;
}
