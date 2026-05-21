import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { messages } from '../diagnostics/utils/messages';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';
import { DivValidator } from '../diagnostics/validators/DivValidator';
import { FakeNode } from './FakeNode';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('DivValidator Test Suite', () => {
  test('plain <div> produces no violation', () => {
    const violations = new DivValidator().validate(new FakeNode('div'), ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('<div onclick> produces messages.div.button as a Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { onclick: 'click()' }),
      ctx(),
    );
    assert.strictEqual(violations[0].message, messages.div.button);
    assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
  });

  test('<div role="button"> produces messages.div.button', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'button' }),
      ctx(),
    );
    assert.strictEqual(violations[0].message, messages.div.button);
  });

  test('<div aria-expanded> produces messages.div.expanded as a Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { 'aria-expanded': 'true' }),
      ctx(),
    );
    assert.strictEqual(violations[0].message, messages.div.expanded);
    assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
  });

  test('a chain of 4 nested divs produces a soup violation on the outermost only', () => {
    let innermost = new FakeNode('div');
    let outermost = innermost;
    for (let i = 0; i < 3; i++) {
      outermost = new FakeNode('div', {}, [outermost]);
    }
    const violationsOnOuter = new DivValidator().validate(outermost, ctx());
    assert.ok(
      violationsOnOuter.find((v) => v.message === messages.div.soup),
      'outermost div should report soup',
    );

    const second = outermost.children[0] as FakeNode;
    const violationsOnSecond = new DivValidator().validate(second, ctx());
    assert.ok(
      !violationsOnSecond.find((v) => v.message === messages.div.soup),
      'second-level div should not report soup',
    );
  });

  test('a chain of 3 nested divs produces no soup violation', () => {
    let div = new FakeNode('div');
    for (let i = 0; i < 2; i++) {
      div = new FakeNode('div', {}, [div]);
    }
    const violations = new DivValidator().validate(div, ctx());
    assert.ok(!violations.find((v) => v.message === messages.div.soup));
  });

  test('<div aria-hidden="true"> with a focusable descendant produces messages.div["aria-hidden"] as a Hint', () => {
    const link = new FakeNode('a', { href: '/blog' });
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [link]);
    const violations = new DivValidator().validate(node, ctx());
    const v = violations.find((x) => x.message === messages.div['aria-hidden']);
    assert.ok(v);
    assert.strictEqual(v?.severity, DiagnosticSeverity.Hint);
  });

  test('<div aria-hidden="true"> with only non-focusable descendants emits no aria-hidden violation', () => {
    const span = new FakeNode('span');
    const node = new FakeNode('div', { 'aria-hidden': 'true' }, [span]);
    const violations = new DivValidator().validate(node, ctx());
    assert.ok(
      !violations.find((v) => v.message === messages.div['aria-hidden']),
    );
  });

  test('<div role="widget"> produces messages.div.abstract + role as a Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'widget' }),
      ctx(),
    );
    const v = violations.find(
      (x) => x.message === messages.div.abstract + 'widget',
    );
    assert.ok(v);
    assert.strictEqual(v?.severity, DiagnosticSeverity.Hint);
  });

  test('<div role="button"> produces no abstract-role violation', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'button' }),
      ctx(),
    );
    assert.ok(
      !violations.find((v) => v.message.startsWith(messages.div.abstract)),
    );
  });
});
