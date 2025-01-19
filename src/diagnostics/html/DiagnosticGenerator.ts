import { Document } from 'domhandler';
import { DomUtils, parseDocument } from 'htmlparser2';
import * as vscode from 'vscode';
import { TAG } from '../utils/constants';
import { Diagnostic } from './Diagnostic';
import NodeOrganizer from './NodeOrganizer';
import {
  AriaValidator,
  AttributesValidator,
  ButtonValidator,
  DivValidator,
  FieldsetValidator,
  HeadingValidator,
  ImageValidator,
  InputValidator,
  LinkValidator,
  NavigationValidator,
  RequiredValidator,
  SectionValidator,
  StyleValidator,
  UniquenessValidator,
  Validator,
} from './validators';

export class HTMLDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private htmlContent: string,
    private document: vscode.TextDocument,
    private validators: Validator[] = [
      new AttributesValidator(),
      new RequiredValidator(),
      new UniquenessValidator(),
      new NavigationValidator(),
      new HeadingValidator(),
      new LinkValidator(),
      new DivValidator(),
      new ButtonValidator(),
      new InputValidator(),
      new FieldsetValidator(),
      new ImageValidator(),
      new SectionValidator(),
      new AriaValidator(),
      new StyleValidator(),
    ]
  ) {}

  /**
   * Generates and returns all diagnostics after running the validation process.
   */
  generateDiagnostics() {
    try {
      const parsedHtml = this.parseHtmlDocument();
      const nodeOrganizer = this.organizeNodes(parsedHtml);
      this.runValidators(nodeOrganizer);
    } catch (error) {
      console.error('Error parsing HTML: ', error);
    }

    return this.diagnostics;
  }

  /**
   * Runs the validators against the organized nodes and collects diagnostics.
   */
  private runValidators(nodeOrganizer: NodeOrganizer) {
    this.validators.forEach((validator) => {
      const nodes = nodeOrganizer.getNodes(validator.nodeTags);

      validator.validate(nodes).forEach((error) => {
        const { diagnostic } = new Diagnostic(this.document, error);
        this.diagnostics.push(diagnostic);
      });
    });
  }

  /**
   * Parses the HTML content into a document object.
   */
  private parseHtmlDocument() {
    return parseDocument(this.htmlContent, {
      withStartIndices: true,
      withEndIndices: true,
    });
  }

  /**
   * Organizes the nodes into a structure accessible by tag name.
   */
  private organizeNodes(parsedHtml: Document) {
    return new NodeOrganizer(this.getNodes(parsedHtml));
  }

  /**
   * Search a node and its children for nodes with the type "tag".
   */
  private getNodes(parsedHtml: Document) {
    return DomUtils.filter((node) => node.type === TAG, parsedHtml.children);
  }
}
