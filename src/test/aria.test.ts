import assert from 'assert';
import { AriaValidator } from '../diagnostics/validators/AriaValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx: ValidationContext = { seenElements: [] };

suite('AriaValidator Test Suite', () => {
  test('div without aria-hidden produces no violation', () => {
    const node = new FakeNode('div');
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 0);
  });

  test('<a href> with aria-hidden produces a violation', () => {
    const node = new FakeNode('a', { href: '/blog', 'aria-hidden': 'true' });
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.aria.hidden);
  });

  test('plain div with aria-hidden produces no violation', () => {
    const node = new FakeNode('div', { 'aria-hidden': 'true' });
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 0);
  });

  test('div with aria-hidden whose subtree contains a focusable link produces a violation', () => {
    const link = new FakeNode('a', { href: '/blog' });
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [link]);
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.aria.hidden);
  });

  test('div with aria-hidden whose subtree contains a button produces a violation', () => {
    const button = new FakeNode('button', {}, []);
    button.text = 'click me';
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [button]);
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.aria.hidden);
  });

  test('aria-hidden on a deeply nested focusable descendant still flags', () => {
    const link = new FakeNode('a', { href: '/contact' });
    let nested = new FakeNode('div', {}, [link]);
    for (let i = 0; i < 2; i++) {
      nested = new FakeNode('div', {}, [nested]);
    }
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [nested]);
    const violations = new AriaValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.aria.hidden);
  });
});
