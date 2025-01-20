import { SourceLocation } from '@babel/types';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';

export interface Validator {
  readonly tags: readonly string[];
  accept<T>(visitor: Visitor<T>, node: TSXElement): T;
  validate(node: TSXElement, elements?: string[]): Diagnostic[];
}

export interface Visitor<T> {
  validate(node: TSXElement): T;
  validateImage(node: TSXElement): T;
}

export type Location = SourceLocation | null | undefined;
