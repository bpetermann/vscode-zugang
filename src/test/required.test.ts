import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { RequiredValidator } from '../diagnostics/validators/RequiredValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('RequiredValidator Test Suite', () => {
  test('document with both <meta> and <title> produces no violations', () => {
    const validator = new RequiredValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta'), c);
    validator.validate(new FakeNode('title'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('document missing <meta> produces a meta.shouldExist violation', () => {
    const validator = new RequiredValidator();
    const c = ctx();
    validator.validate(new FakeNode('title'), c);
    const violations = validator.finalize(c);
    assert.ok(violations.find((v) => v.message === messages.meta.shouldExist));
  });

  test('document missing <title> produces a title.shouldExist violation', () => {
    const validator = new RequiredValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta'), c);
    const violations = validator.finalize(c);
    assert.ok(violations.find((v) => v.message === messages.title.shouldExist));
  });

  test('empty document produces both shouldExist violations as Errors', () => {
    const validator = new RequiredValidator();
    const c = ctx();
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 2);
    assert.ok(violations.every((v) => v.severity === DiagnosticSeverity.Error));
  });

  test('reset() clears accumulated state', () => {
    const validator = new RequiredValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta'), c);
    validator.validate(new FakeNode('title'), c);
    assert.strictEqual(validator.finalize(c).length, 0);

    validator.reset();
    assert.strictEqual(validator.finalize(c).length, 2);
  });
});
