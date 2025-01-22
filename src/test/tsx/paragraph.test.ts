import * as assert from 'assert';
import { PARAGRAPH } from '../../diagnostics/utils/constants';
import { messages } from '../../diagnostics/utils/messages';
import {
  createElement,
  generateDiagnostics,
  getTSXDocument as getDocument,
} from '../helper';

suite('Paragraph Test Suite', () => {
  test('<p> with an abbreviation ', async () => {
    const abbr = 'HTML';
    const element = createElement(PARAGRAPH, {
      text: `${abbr} is the standard markup language for documents designed to be displayed in a web browser`,
    });

    const document = await getDocument(element);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.p.abbr + abbr);
  });

  test('<p> with an abbreviation in <abbr> tag', async () => {
    const abbr = 'HTML';
    const element = createElement(PARAGRAPH, {
      text: `<abbr>${abbr}</abbr> is the standard markup language for documents designed to be displayed in a web browser`,
    });

    const document = await getDocument(element);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  test('<p> with an inline explanation', async () => {
    const abbr = 'HTML';
    const element = createElement(PARAGRAPH, {
      text: `Hypertext Markup Language (${abbr}) is the standard markup language for documents designed to be displayed in a web browser.`,
    });

    const document = await getDocument(element);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });
});
