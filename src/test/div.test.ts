import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { DivValidator } from '../diagnostics/validators/DivValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('DivValidator Test Suite', () => {
  test('plain <div> produces no violation', () => {
    const violations = new DivValidator().validate(new FakeNode('div'), ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('<div onclick> produces messages.div.button as a Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { onclick: 'click()' }),
      ctx()
    );
    assert.strictEqual(violations[0].message, messages.div.button);
    assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
  });

  test('<div role="button"> produces messages.div.button', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { role: 'button' }),
      ctx()
    );
    assert.strictEqual(violations[0].message, messages.div.button);
  });

  test('<div aria-expanded> produces messages.div.expanded as a Hint', () => {
    const violations = new DivValidator().validate(
      new FakeNode('div', { 'aria-expanded': 'true' }),
      ctx()
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
      'outermost div should report soup'
    );

    const second = outermost.children[0] as FakeNode;
    const violationsOnSecond = new DivValidator().validate(second, ctx());
    assert.ok(
      !violationsOnSecond.find((v) => v.message === messages.div.soup),
      'second-level div should not report soup'
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
});
