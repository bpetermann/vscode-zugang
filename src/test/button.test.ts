import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { ButtonValidator } from '../diagnostics/validators/ButtonValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx: ValidationContext = { seenElements: [] };

suite('ButtonValidator Test Suite', () => {
  suite('tabindex', () => {
    test('tabindex > 0 produces a Hint violation', () => {
      const node = new FakeNode('button', { tabindex: '2' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.strictEqual(violations[0].message, messages.button.tabindex);
      assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
    });

    test('tabindex = 0 does not produce a violation', () => {
      const node = new FakeNode('button', { tabindex: '0' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.tabindex));
    });

    test('tabindex = -1 does not produce a violation', () => {
      const node = new FakeNode('button', { tabindex: '-1' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.tabindex));
    });
  });

  suite('disabled', () => {
    test('disabled attribute produces a Warning violation', () => {
      const node = new FakeNode('button', { disabled: '' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.strictEqual(violations[0].message, messages.button.disabled);
      assert.strictEqual(
        violations[0].severity ?? DiagnosticSeverity.Warning,
        DiagnosticSeverity.Warning
      );
    });

    test('button without disabled has no deactivation violation', () => {
      const node = new FakeNode('button');
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.disabled));
    });
  });

  suite('switch role', () => {
    test('role=switch without aria-checked produces a Hint violation', () => {
      const node = new FakeNode('button', { role: 'switch' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.strictEqual(violations[0].message, messages.button.switch);
      assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
    });

    test('role=switch with aria-checked produces no violation', () => {
      const node = new FakeNode('button', { role: 'switch', 'aria-checked': 'true' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.switch));
    });
  });

  suite('text content', () => {
    test('button with no text, no img child, and no label attributes produces a violation', () => {
      const node = new FakeNode('button');
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(violations.find((v) => v.message === messages.button.text));
    });

    test('button with text content produces no text violation', () => {
      const node = new FakeNode('button');
      node.text = 'Submit';
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.text));
    });

    test('button with img child produces no text violation', () => {
      const img = new FakeNode('img', { alt: 'submit' });
      const node = new FakeNode('button', {}, [img]);
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.text));
    });

    test('button with aria-label produces no text violation', () => {
      const node = new FakeNode('button', { 'aria-label': 'submit' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.text));
    });

    test('button with aria-labelledby produces no text violation', () => {
      const node = new FakeNode('button', { 'aria-labelledby': 'heading-id' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.text));
    });

    test('button with title produces no text violation', () => {
      const node = new FakeNode('button', { title: 'Submit form' });
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message === messages.button.text));
    });
  });

  suite('abstract role', () => {
    test('abstract role "command" produces a violation with the role name appended', () => {
      const node = new FakeNode('button', { role: 'command' });
      node.text = 'command';
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(
        violations.find((v) => v.message === messages.button.abstract + 'command')
      );
    });

    test('abstract role "widget" produces a violation with the role name appended', () => {
      const node = new FakeNode('button', { role: 'widget' });
      node.text = 'widget';
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(
        violations.find((v) => v.message === messages.button.abstract + 'widget')
      );
    });

    test('non-abstract role produces no abstract violation', () => {
      const node = new FakeNode('button', { role: 'button' });
      node.text = 'click me';
      const violations = new ButtonValidator().validate(node, ctx);
      assert.ok(!violations.find((v) => v.message?.startsWith(messages.button.abstract)));
    });
  });

  suite('valid button', () => {
    test('button with text and no problematic attributes produces no violations', () => {
      const node = new FakeNode('button');
      node.text = 'Open cart';
      const violations = new ButtonValidator().validate(node, ctx);
      assert.strictEqual(violations.length, 0);
    });
  });
});
