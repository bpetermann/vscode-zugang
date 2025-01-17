import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';

export interface Validator {
  readonly tags: readonly string[];
  accept<T>(visitor: Visitor<T>, node: TSXElement): T;
  validate(node: TSXElement): Diagnostic[];
}

export interface Visitor<T> {
  validate(node: TSXElement): T;
  validateImage(node: TSXElement): T;
}
