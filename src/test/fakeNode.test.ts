import assert from 'assert';
import { FakeNode } from './FakeNode';

suite('FakeNode Test Suite', () => {
  suite('name / text / loc', () => {
    test('defaults are correct', () => {
      const node = new FakeNode();
      assert.strictEqual(node.name, undefined);
      assert.strictEqual(node.text, '');
      assert.strictEqual(node.loc, null);
    });

    test('constructor sets name', () => {
      assert.strictEqual(new FakeNode('div').name, 'div');
    });
  });

  suite('getAttribute / hasAttribute / getAttributes', () => {
    test('getAttribute returns the attribute value', () => {
      const node = new FakeNode('a', { href: '/home' });
      assert.strictEqual(node.getAttribute('href'), '/home');
    });

    test('getAttribute returns undefined for a missing attribute', () => {
      assert.strictEqual(new FakeNode('div').getAttribute('role'), undefined);
    });

    test('hasAttribute returns true when present', () => {
      assert.strictEqual(
        new FakeNode('button', { disabled: '' }).hasAttribute('disabled'),
        true,
      );
    });

    test('hasAttribute returns false when absent', () => {
      assert.strictEqual(new FakeNode('div').hasAttribute('disabled'), false);
    });

    test('getAttributes returns all attribute names', () => {
      const node = new FakeNode('input', { type: 'text', id: 'name' });
      assert.deepStrictEqual(node.getAttributes().sort(), ['id', 'type']);
    });
  });

  suite('getChild', () => {
    test('returns the first child with the matching tag', () => {
      const img = new FakeNode('img', { alt: 'logo' });
      const figure = new FakeNode('figure', {}, [img]);
      const child = figure.getChild('img');
      assert.ok(child);
      assert.strictEqual(child.getAttribute('alt'), 'logo');
    });

    test('returns undefined when no matching child exists', () => {
      assert.strictEqual(new FakeNode('div').getChild('span'), undefined);
    });
  });

  suite('getSequenceLength', () => {
    test('returns 1 for an element with no same-tag nested child', () => {
      assert.strictEqual(new FakeNode('div').getSequenceLength(), 1);
    });

    test('counts consecutive same-tag nesting', () => {
      const inner = new FakeNode('div');
      const mid = new FakeNode('div', {}, [inner]);
      const outer = new FakeNode('div', {}, [mid]);
      assert.strictEqual(outer.getSequenceLength(), 3);
    });

    test('stops counting when tag changes', () => {
      const span = new FakeNode('span');
      const div = new FakeNode('div', {}, [span]);
      assert.strictEqual(div.getSequenceLength(), 1);
    });
  });

  suite('getAbstractRole', () => {
    test('returns the role when it is abstract', () => {
      const node = new FakeNode('div', { role: 'widget' });
      assert.strictEqual(node.getAbstractRole(), 'widget');
    });

    test('returns undefined for a non-abstract role', () => {
      const node = new FakeNode('div', { role: 'button' });
      assert.strictEqual(node.getAbstractRole(), undefined);
    });
  });

  suite('isNotFocusable', () => {
    test('button with no attributes is focusable', () => {
      assert.strictEqual(new FakeNode('button').isNotFocusable(), false);
    });

    test('button with disabled is not focusable', () => {
      assert.strictEqual(
        new FakeNode('button', { disabled: '' }).isNotFocusable(),
        true,
      );
    });

    test('div is not focusable', () => {
      assert.strictEqual(new FakeNode('div').isNotFocusable(), true);
    });

    test('div with positive tabindex is focusable', () => {
      assert.strictEqual(
        new FakeNode('div', { tabindex: '1' }).isNotFocusable(),
        false,
      );
    });

    test('div with tabindex -1 is not focusable', () => {
      assert.strictEqual(
        new FakeNode('div', { tabindex: '-1' }).isNotFocusable(),
        true,
      );
    });

    test('a with href is focusable', () => {
      assert.strictEqual(
        new FakeNode('a', { href: '/home' }).isNotFocusable(),
        false,
      );
    });

    test('a without href is not focusable', () => {
      assert.strictEqual(new FakeNode('a').isNotFocusable(), true);
    });

    test('div with contenteditable=true is focusable', () => {
      assert.strictEqual(
        new FakeNode('div', { contenteditable: 'true' }).isNotFocusable(),
        false,
      );
    });

    test('div with role=button is focusable', () => {
      assert.strictEqual(
        new FakeNode('div', { role: 'button' }).isNotFocusable(),
        false,
      );
    });

    test('button with inert is not focusable', () => {
      assert.strictEqual(
        new FakeNode('button', { inert: '' }).isNotFocusable(),
        true,
      );
    });
  });

  suite('canHaveAriaHidden', () => {
    test('plain div can have aria-hidden', () => {
      assert.strictEqual(new FakeNode('div').canHaveAriaHidden(), true);
    });

    test('button cannot have aria-hidden', () => {
      assert.strictEqual(new FakeNode('button').canHaveAriaHidden(), false);
    });

    test('button with disabled can have aria-hidden', () => {
      assert.strictEqual(
        new FakeNode('button', { disabled: '' }).canHaveAriaHidden(),
        true,
      );
    });

    test('div with focusable child cannot have aria-hidden', () => {
      const button = new FakeNode('button');
      const div = new FakeNode('div', {}, [button]);
      assert.strictEqual(div.canHaveAriaHidden(), false);
    });

    test('div with non-focusable child can have aria-hidden', () => {
      const span = new FakeNode('span');
      const div = new FakeNode('div', {}, [span]);
      assert.strictEqual(div.canHaveAriaHidden(), true);
    });
  });
});
