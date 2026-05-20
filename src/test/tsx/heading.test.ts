import * as assert from 'assert';
import { TSXDiagnosticGenerator } from '../../diagnostics/tsx/DiagnosticGenerator';
import { StyleValidator } from '../../diagnostics/tsx/validators';
import { DIV, H1, H2, H3 } from '../../diagnostics/utils/constants';
import { messages } from '../../diagnostics/utils/messages';
import { HeadingValidator } from '../../diagnostics/validators/HeadingValidator';
import {
  createElement,
  generateDiagnostics,
  getTSXDocument as getDocument,
} from '../helper';

suite('Heading Test Suite', () => {
  const h1 = createElement(H1);
  const h2 = createElement(H2);
  const h3 = createElement(H3);
  const div = createElement(DIV);

  test('<h1> with insufficient color contrast', async () => {
    const element = createElement(H1, {
      color: '#fff',
      backgroundColor: 'white',
    });

    const document = await getDocument(element);
    const { message } = generateDiagnostics(document)?.[0];
    assert.strictEqual(message, messages.style.color);
  });

  test('Multiple <h1> elements should cause warning', async () => {
    const elements = `<>${h1}${div}${h1}</>`;

    const document = await getDocument(elements);
    const diagnostics = generateDiagnostics(document);
    assert.ok(
      diagnostics.some((d) => d.message === messages.h1.shouldBeUnique),
      `expected an h1.shouldBeUnique diagnostic; got: ${diagnostics
        .map((d) => d.message)
        .join(' | ')}`,
    );
  });

  test('Multiple heading elements should pass', async () => {
    const elements = `<>${h1}${h2}${h3}</>`;

    const document = await getDocument(elements);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  test('Empty heading', async () => {
    const elements = `<h1></h1>`;

    const document = await getDocument(elements);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.heading.blank);
  });

  test('<h3> without an <h2> ancestor reports a hierarchy violation', async () => {
    const elements = `<>${h1}${h3}</>`;

    const document = await getDocument(elements);
    const diagnostics = generateDiagnostics(document);

    assert.ok(
      diagnostics.some((d) => d.message === messages.heading.shouldExist),
      `expected a heading.shouldExist diagnostic; got: ${diagnostics
        .map((d) => d.message)
        .join(' | ')}`,
    );
  });

  test('sharing a HeadingValidator across two runs does not leak state', async () => {
    const sharedHeading = new HeadingValidator();

    const firstDoc = await getDocument(h3);
    const firstRun = new TSXDiagnosticGenerator(
      firstDoc.getText(),
      new StyleValidator(),
      [],
      [sharedHeading],
    ).generateDiagnostics();

    assert.ok(
      firstRun.some((d) => d.message === messages.heading.shouldExist),
      'first run should report a missing-parent violation for <h3>',
    );

    const secondDoc = await getDocument(h1);
    const secondRun = new TSXDiagnosticGenerator(
      secondDoc.getText(),
      new StyleValidator(),
      [],
      [sharedHeading],
    ).generateDiagnostics();

    assert.strictEqual(
      secondRun.filter((d) => d.message === messages.heading.shouldExist)
        .length,
      0,
      'reset() should have cleared state from the first run',
    );
  });
});
