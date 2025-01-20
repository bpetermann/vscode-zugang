import * as assert from 'assert';
import { DIV, H1, H2, H3, H4, H5, H6 } from '../../diagnostics/utils/constants';
import { messages } from '../../diagnostics/utils/messages';
import {
  createElement,
  generateDiagnostics,
  getTSXDocument as getDocument,
} from '../helper';

suite('Heading Test Suite', () => {
  const h1 = createElement(H1);
  const h2 = createElement(H2);
  const h3 = createElement(H3);
  const h4 = createElement(H4);
  const h5 = createElement(H5);
  const h6 = createElement(H6);
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
    const { message } = generateDiagnostics(document)?.[0];
    assert.strictEqual(message, messages.heading.unique);
  });

  test('Multiple heading elements should pass', async () => {
    const elements = `<>${h1}${h2}${h3}</>`;

    const document = await getDocument(elements);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  test('Missing heading', async () => {
    const elements = `<>${h1}${h3}</>`;

    const document = await getDocument(elements);
    const { message } = generateDiagnostics(document)?.[0];
    assert.strictEqual(message, messages.heading.skip);
  });

  test('Headings in the wrong order', async () => {
    const elements = `<>${h6}${h5}${h4}${h3}${h2}${h1}</>`;

    const document = await getDocument(elements);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 5);
  });

  test('Empty heading', async () => {
    const elements = `<h1></h1>`;

    const document = await getDocument(elements);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.heading.blank);
  });
});
