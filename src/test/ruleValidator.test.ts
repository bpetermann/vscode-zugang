import assert from 'assert';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../diagnostics/utils/RuleValidator';
import { FakeNode } from './FakeNode';

suite('RuleValidator Test Suite', () => {
  test('FakeNode is usable with a stub RuleValidator', () => {
    const violation: RuleViolation = { message: 'Missing alt attribute' };

    const stubValidator: RuleValidator = {
      tags: ['img'],
      validate(node, _ctx): RuleViolation[] {
        return node.hasAttribute('alt') ? [] : [violation];
      },
    };

    const ctx: ValidationContext = { seenElements: [] };

    assert.deepStrictEqual(stubValidator.validate(new FakeNode('img'), ctx), [
      violation,
    ]);
    assert.deepStrictEqual(
      stubValidator.validate(new FakeNode('img', { alt: 'logo' }), ctx),
      [],
    );
  });

  test('ValidationContext seenElements is passed through to the validator', () => {
    const seen: string[] = [];
    const trackingValidator: RuleValidator = {
      tags: ['h1', 'h2'],
      validate(node, ctx): RuleViolation[] {
        if (node.name) {
          ctx.seenElements.push(node.name);
        }
        return [];
      },
    };

    const ctx: ValidationContext = { seenElements: seen };
    trackingValidator.validate(new FakeNode('h1'), ctx);
    trackingValidator.validate(new FakeNode('h2'), ctx);

    assert.deepStrictEqual(seen, ['h1', 'h2']);
  });
});
