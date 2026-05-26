import { parse } from '@babel/parser';
import * as jsx from '@babel/types';
import assert from 'assert';
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
    test('returns 1-indexed line and 0-indexed column shape matching the HTML adapter', () => {
      // <div /> sits at offset 0..7 on line 1.
      const loc = new TSXNodeAdapter(parseJSX('<div />')).loc;
      assert.deepStrictEqual(loc, {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 7 },
      });
    });
  });

  suite('style', () => {
    test('parses JSX object-literal style prop into a record with kebab-case keys', () => {
      const node = parseJSX(
        '<div style={{ fontSize: "16px", lineHeight: 1.5 }} />',
      );
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
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('href'),
        '/home',
      );
    });

    test('returns undefined for a missing attribute', () => {
      const node = parseJSX('<div />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('role'),
        undefined,
      );
    });

    test('returns stringified value for a NumericLiteral expression (e.g. tabIndex={2})', () => {
      const node = parseJSX('<div tabIndex={2} />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('tabIndex'),
        '2',
      );
    });

    test('returns the string value for a StringLiteral expression (e.g. role={"button"})', () => {
      const node = parseJSX('<div role={"button"} />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('role'),
        'button',
      );
    });

    test('returns "true"/"false" for a BooleanLiteral expression (e.g. hidden={true})', () => {
      const trueNode = parseJSX('<div hidden={true} />');
      assert.strictEqual(
        new TSXNodeAdapter(trueNode).getAttribute('hidden'),
        'true',
      );
      const falseNode = parseJSX('<div hidden={false} />');
      assert.strictEqual(
        new TSXNodeAdapter(falseNode).getAttribute('hidden'),
        'false',
      );
    });

    test('returns cooked string for a no-expression template literal (e.g. role={`button`})', () => {
      const node = parseJSX('<div role={`button`} />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('role'),
        'button',
      );
    });

    test('returns undefined for an identifier expression (e.g. tabIndex={x})', () => {
      const node = parseJSX('<div tabIndex={x} />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('tabIndex'),
        undefined,
      );
    });

    test('returns undefined for a template literal containing expressions', () => {
      const node = parseJSX('<div role={`foo-${x}`} />');
      assert.strictEqual(
        new TSXNodeAdapter(node).getAttribute('role'),
        undefined,
      );
    });
  });

  suite('hasAttribute', () => {
    test('returns true when attribute is present', () => {
      const node = parseJSX('<button disabled />');
      assert.strictEqual(
        new TSXNodeAdapter(node).hasAttribute('disabled'),
        true,
      );
    });

    test('returns false when attribute is absent', () => {
      const node = parseJSX('<button />');
      assert.strictEqual(
        new TSXNodeAdapter(node).hasAttribute('disabled'),
        false,
      );
    });
  });

  suite('getAttributes', () => {
    test('returns all attribute names', () => {
      const node = parseJSX('<input type="text" id="name" />');
      assert.deepStrictEqual(new TSXNodeAdapter(node).getAttributes().sort(), [
        'id',
        'type',
      ]);
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
        false,
      );
    });

    test('button with disabled is not focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button disabled />')).isNotFocusable(),
        true,
      );
    });

    test('div is not focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div />')).isNotFocusable(),
        true,
      );
    });

    test('div with positive tabIndex is focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div tabindex="1" />')).isNotFocusable(),
        false,
      );
    });

    test('a with href is focusable', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<a href="/home" />')).isNotFocusable(),
        false,
      );
    });
  });

  suite('nextElementSibling', () => {
    test('returns the next JSXElement sibling, skipping whitespace text', () => {
      const parent = parseJSX('<div><a /> <a /></div>');
      const children = new TSXNodeAdapter(parent).children;
      assert.strictEqual(children[0].nextElementSibling?.name, 'a');
    });

    test('skips JSXExpressionContainer between siblings', () => {
      const parent = parseJSX('<div><a />{foo}<span /></div>');
      const children = new TSXNodeAdapter(parent).children;
      assert.strictEqual(children[0].nextElementSibling?.name, 'span');
    });
  });

  suite('previousElementSibling', () => {
    test('returns the previous JSXElement sibling', () => {
      const parent = parseJSX('<div><a /><span /></div>');
      const children = new TSXNodeAdapter(parent).children;
      assert.strictEqual(children[1].previousElementSibling?.name, 'a');
    });

    test('skips JSXExpressionContainer between siblings', () => {
      const parent = parseJSX('<div><a />{foo}<span /></div>');
      const children = new TSXNodeAdapter(parent).children;
      assert.strictEqual(children[1].previousElementSibling?.name, 'a');
    });
  });

  suite('parent', () => {
    test('returns the enclosing JSXElement as an adapter', () => {
      const root = parseJSX('<section><h1 /></section>');
      const children = new TSXNodeAdapter(root).children;
      assert.strictEqual(children[0].parent?.name, 'section');
    });

    test('is undefined at the root', () => {
      const root = parseJSX('<div />');
      assert.strictEqual(new TSXNodeAdapter(root).parent, undefined);
    });
  });

  suite('sibling navigation edges', () => {
    test('first child has no previousElementSibling', () => {
      const children = new TSXNodeAdapter(parseJSX('<div><a /><span /></div>'))
        .children;
      assert.strictEqual(children[0].previousElementSibling, undefined);
    });

    test('last child has no nextElementSibling', () => {
      const children = new TSXNodeAdapter(parseJSX('<div><a /><span /></div>'))
        .children;
      assert.strictEqual(children[1].nextElementSibling, undefined);
    });

    test('root element returns undefined for both siblings', () => {
      const adapter = new TSXNodeAdapter(parseJSX('<div />'));
      assert.strictEqual(adapter.previousElementSibling, undefined);
      assert.strictEqual(adapter.nextElementSibling, undefined);
    });
  });

  suite('canHaveAriaHidden', () => {
    test('plain div can have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<div />')).canHaveAriaHidden(),
        true,
      );
    });

    test('button cannot have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button />')).canHaveAriaHidden(),
        false,
      );
    });

    test('button with disabled can have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(parseJSX('<button disabled />')).canHaveAriaHidden(),
        true,
      );
    });

    test('div with focusable child cannot have aria-hidden', () => {
      assert.strictEqual(
        new TSXNodeAdapter(
          parseJSX('<div><button /></div>'),
        ).canHaveAriaHidden(),
        false,
      );
    });
  });
});
