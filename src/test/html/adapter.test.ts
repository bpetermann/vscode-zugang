import assert from 'assert';
import { Element, Text } from 'domhandler';
import { HTMLNodeAdapter } from '../../diagnostics/html/HTMLNodeAdapter';

suite('HTMLNodeAdapter Test Suite', () => {
  suite('name', () => {
    test('returns the element tag name', () => {
      const adapter = new HTMLNodeAdapter(new Element('button', {}));
      assert.strictEqual(adapter.name, 'button');
    });
  });

  suite('text', () => {
    test('returns text content of the first text child', () => {
      const text = new Text('Click me');
      const el = new Element('button', {}, [text]);
      assert.strictEqual(new HTMLNodeAdapter(el).text, 'Click me');
    });

    test('returns empty string when no text child exists', () => {
      const el = new Element('div', {});
      assert.strictEqual(new HTMLNodeAdapter(el).text, '');
    });
  });

  suite('loc', () => {
    test('derives 1-indexed line and 0-indexed column from char offsets and source text', () => {
      // source layout (24 chars):
      //   <div>\n  <p>hi</p>\n</div>
      //   0    5  8       16
      // <p>: startIndex 8, endIndex 16 (the closing '>') — both on line 2.
      const source = '<div>\n  <p>hi</p>\n</div>';
      const el = new Element('p', {});
      el.startIndex = 8;
      el.endIndex = 16;
      const adapter = new HTMLNodeAdapter(el, source);
      assert.deepStrictEqual(adapter.loc, {
        start: { line: 2, column: 2 },
        end: { line: 2, column: 10 },
      });
    });
  });

  suite('startIndex / endIndex', () => {
    test('returns undefined when not set by parser', () => {
      const el = new Element('div', {});
      const adapter = new HTMLNodeAdapter(el, '');
      assert.strictEqual(adapter.startIndex, undefined);
      assert.strictEqual(adapter.endIndex, undefined);
    });

    test('returns values when set by parser', () => {
      const el = new Element('div', {});
      el.startIndex = 5;
      el.endIndex = 20;
      const adapter = new HTMLNodeAdapter(el, '');
      assert.strictEqual(adapter.startIndex, 5);
      assert.strictEqual(adapter.endIndex, 20);
    });
  });

  suite('style', () => {
    test('parses inline style string into a record', () => {
      const el = new Element('div', { style: 'color: red; font-size: 16px' });
      const style = new HTMLNodeAdapter(el).style;
      assert.strictEqual(style['color'], 'red');
      assert.strictEqual(style['font-size'], '16px');
    });

    test('returns empty object when no style attribute', () => {
      const el = new Element('div', {});
      assert.deepStrictEqual(new HTMLNodeAdapter(el).style, {});
    });
  });

  suite('getAttribute', () => {
    test('returns the attribute value', () => {
      const el = new Element('a', { href: '/home' });
      assert.strictEqual(new HTMLNodeAdapter(el).getAttribute('href'), '/home');
    });

    test('returns undefined for missing attribute', () => {
      const el = new Element('div', {});
      assert.strictEqual(
        new HTMLNodeAdapter(el).getAttribute('role'),
        undefined,
      );
    });
  });

  suite('hasAttribute', () => {
    test('returns true when attribute exists', () => {
      const el = new Element('button', { disabled: '' });
      assert.strictEqual(
        new HTMLNodeAdapter(el).hasAttribute('disabled'),
        true,
      );
    });

    test('returns false when attribute is absent', () => {
      const el = new Element('div', {});
      assert.strictEqual(
        new HTMLNodeAdapter(el).hasAttribute('disabled'),
        false,
      );
    });
  });

  suite('getAttributes', () => {
    test('returns all attribute names', () => {
      const el = new Element('input', { type: 'text', id: 'name' });
      assert.deepStrictEqual(new HTMLNodeAdapter(el).getAttributes().sort(), [
        'id',
        'type',
      ]);
    });
  });

  suite('children', () => {
    test('returns only Element children as adapters', () => {
      const child = new Element('span', {});
      const text = new Text('hello');
      const el = new Element('div', {}, [text, child]);
      const children = new HTMLNodeAdapter(el).children;
      assert.strictEqual(children.length, 1);
      assert.strictEqual(children[0].name, 'span');
    });
  });

  suite('getChild', () => {
    test('returns the first child with the matching tag', () => {
      const img = new Element('img', { alt: 'logo' });
      const el = new Element('figure', {}, [img]);
      const child = new HTMLNodeAdapter(el).getChild('img');
      assert.ok(child);
      assert.strictEqual(child.getAttribute('alt'), 'logo');
    });

    test('returns undefined when no matching child exists', () => {
      const el = new Element('div', {});
      assert.strictEqual(new HTMLNodeAdapter(el).getChild('span'), undefined);
    });
  });

  suite('getSequenceLength', () => {
    test('returns 1 for an element with no same-tag nested child', () => {
      const el = new Element('div', {});
      assert.strictEqual(new HTMLNodeAdapter(el).getSequenceLength(), 1);
    });

    test('counts consecutive same-tag nesting', () => {
      const inner = new Element('div', {});
      const mid = new Element('div', {}, [inner]);
      const outer = new Element('div', {}, [mid]);
      assert.strictEqual(new HTMLNodeAdapter(outer).getSequenceLength(), 3);
    });
  });

  suite('getAbstractRole', () => {
    test('returns the role when it is abstract', () => {
      const el = new Element('div', { role: 'widget' });
      assert.strictEqual(new HTMLNodeAdapter(el).getAbstractRole(), 'widget');
    });

    test('returns undefined for a non-abstract role', () => {
      const el = new Element('div', { role: 'button' });
      assert.strictEqual(new HTMLNodeAdapter(el).getAbstractRole(), undefined);
    });
  });

  suite('isNotFocusable', () => {
    test('button with no attributes is focusable', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(new Element('button', {})).isNotFocusable(),
        false,
      );
    });

    test('button with disabled is not focusable', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(
          new Element('button', { disabled: '' }),
        ).isNotFocusable(),
        true,
      );
    });

    test('div is not focusable', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(new Element('div', {})).isNotFocusable(),
        true,
      );
    });

    test('div with positive tabindex is focusable', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(
          new Element('div', { tabindex: '1' }),
        ).isNotFocusable(),
        false,
      );
    });

    test('a with href is focusable', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(
          new Element('a', { href: '/home' }),
        ).isNotFocusable(),
        false,
      );
    });
  });

  suite('canHaveAriaHidden', () => {
    test('plain div can have aria-hidden', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(new Element('div', {})).canHaveAriaHidden(),
        true,
      );
    });

    test('button cannot have aria-hidden', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(new Element('button', {})).canHaveAriaHidden(),
        false,
      );
    });

    test('button with disabled can have aria-hidden', () => {
      assert.strictEqual(
        new HTMLNodeAdapter(
          new Element('button', { disabled: '' }),
        ).canHaveAriaHidden(),
        true,
      );
    });

    test('div with focusable child cannot have aria-hidden', () => {
      const button = new Element('button', {});
      const div = new Element('div', {}, [button]);
      assert.strictEqual(new HTMLNodeAdapter(div).canHaveAriaHidden(), false);
    });
  });
});
