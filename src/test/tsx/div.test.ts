import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { DivValidator } from '../../diagnostics/tsx/validators/Div';
import { messages } from '../../diagnostics/utils/messages';
import { FakeNode } from '../FakeNode';
import { ValidationContext } from '../../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('TSX DivValidator Test Suite', () => {
  test('plain div produces no violation', () => {
    const violations = new DivValidator().validate(new FakeNode('div'), ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('div with onclick produces messages.div.button as Information', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { onclick: 'click()' }),
      ctx()
    );
    assert.strictEqual(violations[0].message, messages.div.button);
    assert.strictEqual(violations[0].severity, DiagnosticSeverity.Information);
  });

  test('div with role=button produces messages.div.button', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'button' }),
      ctx()
    );
    assert.strictEqual(violations[0].message, messages.div.button);
  });

  test('div with aria-expanded produces messages.div.expanded as Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { 'aria-expanded': 'true' }),
      ctx()
    );
    assert.ok(violations.find((v) => v.message === messages.div.expanded));
  });

  test('div with aria-hidden and a focusable descendant produces messages.div["aria-hidden"]', () => {
    const link = new FakeNode('a', { href: '/blog' });
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [link]);
    const violations = new DivValidator().validate(node, ctx());
    assert.ok(violations.find((v) => v.message === messages.div['aria-hidden']));
  });

  test('div with abstract role produces messages.div.abstract + role', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'widget' }),
      ctx()
    );
    assert.ok(
      violations.find((v) => v.message === messages.div.abstract + 'widget')
    );
  });

  test('a chain of 5 nested divs produces messages.div.soup as Information', () => {
    let div = new FakeNode('div');
    for (let i = 0; i < 4; i++) {
      div = new FakeNode('div', {}, [div]);
    }
    const violations = new DivValidator().validate(div, ctx());
    const soup = violations.find((v) => v.message === messages.div.soup);
    assert.ok(soup);
    assert.strictEqual(soup?.severity, DiagnosticSeverity.Information);
  });

  test('a chain of 4 nested divs produces no soup violation (TSX threshold is 5)', () => {
    let div = new FakeNode('div');
    for (let i = 0; i < 3; i++) {
      div = new FakeNode('div', {}, [div]);
    }
    const violations = new DivValidator().validate(div, ctx());
    assert.ok(!violations.find((v) => v.message === messages.div.soup));
  });
});
