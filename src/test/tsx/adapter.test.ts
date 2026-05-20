import assert from 'assert';
import { parse } from '@babel/parser';
import * as jsx from '@babel/types';
import { TSXNodeAdapter } from '../../diagnostics/tsx/TSXNodeAdapter';

function parseJSX(code: string): jsx.JSXElement {
  const file = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  const stmt = file.program.body[0] as jsx.ExpressionStatement;
  return stmt.expression as jsx.JSXElement;
}

suite('TSXNodeAdapter Test Suite', () => {
  suite('name', () => {
    test('returns the tag name for a simple identifier', () => {
      const node = parseJSX('<button />');
      assert.strictEqual(new TSXNodeAdapter(node).name, 'button');
    });

    test('returns dot-separated name for member expressions', () => {
      const node = parseJSX('<Foo.Bar />');
      assert.strictEqual(new TSXNodeAdapter(node).name, 'Foo.Bar');
    });
  });

  suite('text', () => {
    test('returns the text content of the first text child', () => {
      const node = parseJSX('<button>Click me</button>');
      assert.strictEqual(new TSXNodeAdapter(node).text, 'Click me');
    });

    test('returns empty string when no text child exists', () => {
      const node = parseJSX('<div />');
      assert.strictEqual(new TSXNodeAdapter(node).text, '');
    });
  });

  suite('loc', () => {
    test('returns a NodeLocation with start/end line and column', () => {
      const node = parseJSX('<div />');
      const loc = new TSXNodeAdapter(node).loc;
      assert.ok(loc);
      assert.strictEqual(typeof loc.start.line, 'number');
      assert.strictEqual(typeof loc.start.column, 'number');
    });
  });

  suite('startIndex / endIndex', () => {
    test('both are always undefined for TSX nodes', () => {
      const node = parseJSX('<div />');
      const adapter = new TSXNodeAdapter(node);
      assert.strictEqual(adapter.startIndex, undefined);
      assert.strictEqual(adapter.endIndex, undefined);
    });
  });

  suite('style', () => {
    test('parses JSX object-literal style prop into a record with kebab-case keys', () => {
      const node = parseJSX('<div style={{ fontSize: "16px", lineHeight: 1.5 }} />');
      const style = new TSXNodeAdapter(node).style;
      assert.strictEqual(style['font-size'], '16px');
      assert.strictEqual(style['line-height'], 1.5);
    });

    test('returns empty object when no style prop present', () => {
      const node = parseJSX('<div />');
      assert.deepStrictEqual(new TSXNodeAdapter(node).style, {});
    });
  });

  suite('getAttribute', () => {
    test('returns the string value of an attribute', () => {
      const node = parseJSX('<a href="/home">link</a>');
      assert.strictEqual(new TSXNodeAdapter(node).getAttribute('href'), '/home');
    });

    test('returns undefined for a missing attribute', () => {
      const node = parseJSX('<div />');
      assert.strictEqual(new TSXNodeAdapter(node).getAttribute('role'), undefined);
    });

    test('returns undefined for a non-string-literal value', () => {
      const node = parseJSX('<div tabIndex={0} />');
      assert.strictEqual(new TSXNodeAdapter(node).getAttribute('tabIndex'), undefined);
    });
  });

  suite('hasAttribute', () => {
    test('returns true when attribute is present', () => {
      const node = parseJSX('<button disabled />');
      assert.strictEqual(new TSXNodeAdapter(node).hasAttribute('disabled'), true);
    });

    test('returns false when attribute is absent', () => {
      const node = parseJSX('<button />');
      assert.strictEqual(new TSXNodeAdapter(node).hasAttribute('disabled'), false);
    });
  });

  suite('getAttributes', () => {
    test('returns all attribute names', () => {
      const node = parseJSX('<input type="text" id="name" />');
      assert.deepStrictEqual(
        new TSXNodeAdapter(node).getAttributes().sort(),
        ['id', 'type']
      );
    });
  });

  suite('children', () => {
    test('returns only JSXElement children as adapters', () => {
      const node = parseJSX('<div><span /></div>');
      const children = new TSXNodeAdapter(node).children;
      assert.strictEqual(children.length, 1);
      assert.strictEqual(children[0].name, 'span');
    });

    test('excludes text and expression children', () => {
      const node = parseJSX('<div>hello{foo}</div>');
      assert.strictEqual(new TSXNodeAdapter(node).children.length, 0);
    });
  });

  suite('getChild', () => {
    test('returns the first child matching the tag', () => {
      const node = parseJSX('<figure><img alt="logo" /></figure>');
      const child = new TSXNodeAdapter(node).getChild('img');
      assert.ok(child);
      assert.strictEqual(child.getAttribute('alt'), 'logo');
    });

    test('returns undefined when no matching child exists', () => {
      const node = parseJSX('<div />');
      assert.strictEqual(new TSXNodeAdapter(node).getChild('span'), undefined);
    });
  });

  suite('getSequenceLength', () => {
    test('returns 1 for a non-nested element', () => {
      const node = parseJSX('<div />');
      assert.strictEqual(new TSXNodeAdapter(node).getSequenceLength(), 1);
    });

    test('counts nested same-tag elements', () => {
      const node = parseJSX('<div><div><div /></div></div>');
      assert.strictEqual(new TSXNodeAdapter(node).getSequenceLength(), 3);
    });
  });

  suite('getAbstractRole', () => {
    test('returns the role when it is abstract', () => {
      const node = parseJSX('<div role="widget" />');
      assert.strictEqual(new TSXNodeAdapter(node).getAbstractRole(), 'widget');
    });

    test('returns undefined for a concrete role', () => {
      const node = parseJSX('<div role="button" />');
      assert.strictEqual(new TSXNodeAdapter(node).getAbstractRole(), undefined);
    });
  });

  suite('isNotFocusable', () => {
    test('button with no attributes is focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button />')).isNotFocusable(),
        false
      );
    });

    test('button with disabled is not focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button disabled />')).isNotFocusable(),
        true
      );
    });

    test('div is not focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div />')).isNotFocusable(),
        true
      );
    });

    test('div with positive tabIndex is focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div tabindex="1" />')).isNotFocusable(),
        false
      );
    });

    test('a with href is focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<a href="/home" />')).isNotFocusable(),
        false
      );
    });
  });

  suite('canHaveAriaHidden', () => {
    test('plain div can have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div />')).canHaveAriaHidden(),
        true
      );
    });

    test('button cannot have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button />')).canHaveAriaHidden(),
        false
      );
    });

    test('button with disabled can have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button disabled />')).canHaveAriaHidden(),
        true
      );
    });

    test('div with focusable child cannot have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(
          parseJSX('<div><button /></div>')
        ).canHaveAriaHidden(),
        false
      );
    });
  });
});
