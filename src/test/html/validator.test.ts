import * as assert from 'assert';
import { Element, Text } from 'domhandler';
import {
  DivValidator,
  HeadingValidator,
  InputValidator,
  LinkValidator,
} from '../../diagnostics/html/validators';
import { messages } from '../../diagnostics/utils/messages';

suite('Validator Test Suite', () => {
test('<h4> tag present without preceding <h3> tag', async () => {
    const h4 = new Element('h4', {});

    const { message } = new HeadingValidator().validate([h4])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h4> and <h3> tags present without preceding <h2> tag', async () => {
    const h4 = new Element('h4', {});
    const h3 = new Element('h3', {});

    const { message } = new HeadingValidator().validate([h4, h3])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h4>, <h3>, and <h2> tags present with missing <h2> tag', async () => {
    const h4 = new Element('h4', {});
    const h3 = new Element('h3', {});
    const h2 = new Element('h2', {});

    const { message } = new HeadingValidator().validate([h4, h3, h2])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h2> tag present with existing <h1> tag', async () => {
    const h2 = new Element('h2', {});
    const h1 = new Element('h1', {});

    const errors = new HeadingValidator().validate([h2, h1]);

    assert.strictEqual(errors.length, 0);
  });

  test('<a> tag with a generic description', async () => {
    const linktext = 'Click';
    const a = new Element('a', { href: '/blog' }, [new Text(linktext)]);

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, `${messages.link.generic}"${linktext}"`);
  });

  test('<a> tag with a good description', async () => {
    const linktext = 'Learn how to create meaningful content';
    const a = new Element('a', { href: '/blog' }, [new Text(linktext)]);

    const errors = new LinkValidator().validate([a]);

    assert.strictEqual(errors.length, 0);
  });

  test('<a> tag with an "onclick" event', async () => {
    const a = new Element('a', { onclick: 'click()' });

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, messages.link.onclick);
  });

  test('<a> tag with "mailto" in the "href"', async () => {
    const linktext = 'If you want to learn more about our products, contact us';
    const a = new Element('a', { href: 'mailto:support@office.com' }, [
      new Text(linktext),
    ]);

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, messages.link.mail);
  });

  test('<a> tag with all checks failing', async () => {
    const linktext = 'click';
    const a = new Element(
      'a',
      {
        onclick: 'click()',
        href: 'mailto:support@office.com',
      },
      [new Text(linktext)]
    );

    const errors = new LinkValidator().validate([a]);

    assert.strictEqual(errors.length, 3);
  });

  test('<a> tag missing the aria-current attribute', async () => {
    const anchors = ['home', 'products', 'contact'].map(
      (a) =>
        new Element('a', {
          href: a,
        })
    );

    const { message } = new LinkValidator().validate(anchors)?.[0];

    assert.strictEqual(message, messages.link.current);
  });

  test('<a> tag in a long consecutive list', async () => {
    const anchors = new Array(6)
      .fill(null)
      .map(
        (_, i) =>
          new Element('a', i === 0 ? { 'aria-current': 'page' } : {}, [
            new Text(`link number ${i}`),
          ])
      )
      .map((element, i, self) => {
        if (i < self.length - 1) {
          element.nextSibling = self[i + 1];
        }
        return element;
      });

    const { message } = new LinkValidator().validate(anchors)?.[0];

    assert.strictEqual(message, messages.link.list);
  });

test('<div> element with "onclick" event', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { onclick: 'click()' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> element with role="button"', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { role: 'button' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> used as a button', async () => {
    const errors = new DivValidator().validate([
      new Element('div', { role: 'button' }),
      new Element('div', { onclick: 'click()' }),
    ]);

    assert.strictEqual(errors.length, 2);
  });

  test('<div> tag with aria-expanded attribute', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { 'aria-expanded': 'true' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.expanded);
  });

  test('Long sequence of nested <div> elements', async () => {
    let div = new Element('div', {});

    for (let index = 0; index < 3; index++) {
      div = new Element('div', {}, [div]);
    }

    const { message } = new DivValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.div.soup);
  });

  test('A valid <div> element', async () => {
    const errors = new DivValidator().validate([new Element('div', {})]);
    assert.strictEqual(errors.length, 0);
  });

  test('<input> field nested inside a <label> element', async () => {
    const label = new Element('label', {}, [new Text('Username')]);
    const input = new Element('input', { type: 'text' });
    input.parent = label;

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field adjacent to a <label> element with a line break', async () => {
    const label = new Element('label', {}, [new Text('Username')]);
    const input = new Element('input', { id: 'username' });
    input.prev = label;

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field with "aria-labelledby" attribute', async () => {
    const input = new Element('input', {
      type: 'text',
      'aria-labelledby': 'btn_search',
    });

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field with no visible label or reference', async () => {
    const input = new Element('input', { type: 'text' });

    const { message } = new InputValidator().validate([input])?.[0];

    assert.strictEqual(message, messages.input.label);
  });


});
