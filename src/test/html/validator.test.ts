import * as assert from 'assert';
import { Element, Text } from 'domhandler';
import {
  AriaValidator,
  AttributesValidator,
  ButtonValidator,
  DivValidator,
  FieldsetValidator,
  HeadingValidator,
  ImageValidator,
  InputValidator,
  LinkValidator,
  NavigationValidator,
  RequiredValidator,
  SectionValidator,
  UniquenessValidator,
} from '../../diagnostics/html/validators';
import { messages } from '../../diagnostics/utils/messages';

suite('Validator Test Suite', () => {
  test('Missing lang attribute in <html> tag', async () => {
    const errors = new AttributesValidator().validate([
      new Element('html', {}),
    ]);
    assert.strictEqual(errors[0].message, messages.html.hasMissingAttribute);
  });

  test('Missing viewport attribute in <meta> element', async () => {
    const errors = new RequiredValidator().validate([new Element('body', {})]);
    assert.strictEqual(errors[0].message, messages.meta.shouldExist);
  });

  test('Missing <title> tag', async () => {
    const errors = new RequiredValidator().validate([new Element('body', {})]);
    assert.strictEqual(errors[1].message, messages.title.shouldExist);
  });

  test('Empty <html> tag should return two diagnostics', async () => {
    const errors = new RequiredValidator().validate([new Element('html', {})]);
    assert.strictEqual(errors.length, 2);
  });

  test('Empty lang attribute in <html> tag', async () => {
    const { message } = new AttributesValidator().validate([
      new Element('html', { lang: '' }),
    ])?.[0];
    assert.strictEqual(message, messages.html.hasMissingAttribute);
  });

  test('Two occurrences of <title> tag', async () => {
    const { message } = new UniquenessValidator().validate([
      new Element('title', {}),
      new Element('title', {}),
    ])?.[0];

    assert.strictEqual(message, messages.title.shouldBeUnique);
  });

  test('Two occurrences of <main> tag', async () => {
    const { message } = new UniquenessValidator().validate([
      new Element('main', {}),
      new Element('main', {}),
    ])?.[0];

    assert.strictEqual(message, messages.main.shouldBeUnique);
  });

  test('Two occurrences of <h1> tag', async () => {
    const { message } = new UniquenessValidator().validate([
      new Element('h1', {}),
      new Element('h1', {}),
    ])?.[0];

    assert.strictEqual(message, messages.h1.shouldBeUnique);
  });

  test('<h4> tag present without preceding <h3> tag', async () => {
    const h4 = new Element('h4', {});

    const { message } = new HeadingValidator().validate([h4])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h4> and <h3> tags present without preceding <h2> tag', async () => {
    const h4 = new Element('h4', {});
    const h3 = new Element('h3', {});

    const { message } = new HeadingValidator().validate([h4, h3])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h4>, <h3>, and <h2> tags present with missing <h2> tag', async () => {
    const h4 = new Element('h4', {});
    const h3 = new Element('h3', {});
    const h2 = new Element('h2', {});

    const { message } = new HeadingValidator().validate([h4, h3, h2])?.[0];

    assert.strictEqual(message, messages.heading.shouldExist);
  });

  test('<h2> tag present with existing <h1> tag', async () => {
    const h2 = new Element('h2', {});
    const h1 = new Element('h1', {});

    const errors = new HeadingValidator().validate([h2, h1]);

    assert.strictEqual(errors.length, 0);
  });

  test('<a> tag with a generic description', async () => {
    const linktext = 'Click';
    const a = new Element('a', { href: '/blog' }, [new Text(linktext)]);

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, `${messages.link.generic}"${linktext}"`);
  });

  test('<a> tag with a good description', async () => {
    const linktext = 'Learn how to create meaningful content';
    const a = new Element('a', { href: '/blog' }, [new Text(linktext)]);

    const errors = new LinkValidator().validate([a]);

    assert.strictEqual(errors.length, 0);
  });

  test('<a> tag with an "onclick" event', async () => {
    const a = new Element('a', { onclick: 'click()' });

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, messages.link.onclick);
  });

  test('<a> tag with "mailto" in the "href"', async () => {
    const linktext = 'If you want to learn more about our products, contact us';
    const a = new Element('a', { href: 'mailto:support@office.com' }, [
      new Text(linktext),
    ]);

    const { message } = new LinkValidator().validate([a])?.[0];

    assert.strictEqual(message, messages.link.mail);
  });

  test('<a> tag with all checks failing', async () => {
    const linktext = 'click';
    const a = new Element(
      'a',
      {
        onclick: 'click()',
        href: 'mailto:support@office.com',
      },
      [new Text(linktext)]
    );

    const errors = new LinkValidator().validate([a]);

    assert.strictEqual(errors.length, 3);
  });

  test('<a> tag missing the aria-current attribute', async () => {
    const anchors = ['home', 'products', 'contact'].map(
      (a) =>
        new Element('a', {
          href: a,
        })
    );

    const { message } = new LinkValidator().validate(anchors)?.[0];

    assert.strictEqual(message, messages.link.current);
  });

  test('<a> tag in a long consecutive list', async () => {
    const anchors = new Array(6)
      .fill(null)
      .map(
        (_, i) =>
          new Element('a', i === 0 ? { 'aria-current': 'page' } : {}, [
            new Text(`link number ${i}`),
          ])
      )
      .map((element, i, self) => {
        if (i < self.length - 1) {
          element.nextSibling = self[i + 1];
        }
        return element;
      });

    const { message } = new LinkValidator().validate(anchors)?.[0];

    assert.strictEqual(message, messages.link.list);
  });

  test('Two occurrences of <nav> without attributes', async () => {
    const { message } = new NavigationValidator().validate([
      new Element('nav', {}),
      new Element('nav', {}),
    ])?.[0];

    assert.strictEqual(message, messages.nav.label);
  });

  test('Two occurrences of <nav> with attributes', async () => {
    const errors = new NavigationValidator().validate([
      new Element('nav', { 'aria-label': 'main' }),
      new Element('nav', { 'aria-label': 'customer service' }),
    ]);

    assert.strictEqual(errors.length, 0);
  });

  test('<div> element with "onclick" event', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { onclick: 'click()' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> element with role="button"', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { role: 'button' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> used as a button', async () => {
    const errors = new DivValidator().validate([
      new Element('div', { role: 'button' }),
      new Element('div', { onclick: 'click()' }),
    ]);

    assert.strictEqual(errors.length, 2);
  });

  test('<div> tag with aria-expanded attribute', async () => {
    const { message } = new DivValidator().validate([
      new Element('div', { 'aria-expanded': 'true' }),
    ])?.[0];

    assert.strictEqual(message, messages.div.expanded);
  });

  test('Long sequence of nested <div> elements', async () => {
    let div = new Element('div', {});

    for (let index = 0; index < 3; index++) {
      div = new Element('div', {}, [div]);
    }

    const { message } = new DivValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.div.soup);
  });

  test('A valid <div> element', async () => {
    const errors = new DivValidator().validate([new Element('div', {})]);
    assert.strictEqual(errors.length, 0);
  });

  test('<button> with role="switch" but missing aria-checked', async () => {
    const button = new Element('button', { role: 'switch' });
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.switch);
  });

  test('<button> with disabled role', async () => {
    const button = new Element('button', { disabled: 'true' });
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.disabled);
  });

  test('<button> with "tabindex" greater than zero', async () => {
    const button = new Element('button', { tabindex: '2' });
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.tabindex);
  });

  test('<button> with no text content', async () => {
    const button = new Element('button', {});
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.text);
  });

  test('<button> with no text but <img> as child', async () => {
    const img = new Element('img', { src: '/sunrise.png', alt: 'sunrise' });
    const button = new Element('button', {}, [img]);
    const errors = new ButtonValidator().validate([button]);

    assert.strictEqual(errors.length, 0);
  });

  test('<button> with no text but "aria-label"', async () => {
    const button = new Element('button', { 'aria-label': 'product count' }, []);
    const errors = new ButtonValidator().validate([button]);

    assert.strictEqual(errors.length, 0);
  });

  test('<button> with no text but "aria-labelledby"', async () => {
    const button = new Element(
      'button',
      { 'aria-labelledby': 'submit-heading' },
      []
    );
    const errors = new ButtonValidator().validate([button]);

    assert.strictEqual(errors.length, 0);
  });

  test('<button> with no text but "title"', async () => {
    const button = new Element('button', { title: 'submit form' }, []);
    const errors = new ButtonValidator().validate([button]);

    assert.strictEqual(errors.length, 0);
  });

  test('<button> with abstract role "command"', async () => {
    const button = new Element('button', { role: 'command' }, [
      new Text('command'),
    ]);
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.abstract);
  });

  test('<button> with abstract role "widget"', async () => {
    const button = new Element('button', { role: 'widget' }, [
      new Text('command'),
    ]);
    const { message } = new ButtonValidator().validate([button])?.[0];

    assert.strictEqual(message, messages.button.abstract);
  });

  test('<input> field nested inside a <label> element', async () => {
    const label = new Element('label', {}, [new Text('Username')]);
    const input = new Element('input', { type: 'text' });
    input.parent = label;

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field adjacent to a <label> element with a line break', async () => {
    const label = new Element('label', {}, [new Text('Username')]);
    const input = new Element('input', { id: 'username' });
    input.prev = label;

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field with "aria-labelledby" attribute', async () => {
    const input = new Element('input', {
      type: 'text',
      'aria-labelledby': 'btn_search',
    });

    const errors = new InputValidator().validate([input]);

    assert.strictEqual(errors.length, 0);
  });

  test('<input> field with no visible label or reference', async () => {
    const input = new Element('input', { type: 'text' });

    const { message } = new InputValidator().validate([input])?.[0];

    assert.strictEqual(message, messages.input.label);
  });

  test('<fieldset> with <legend> as the first child>', async () => {
    const fieldset = new Element('fieldset', {});
    fieldset.children = [
      new Element('legend', {}, [new Text('What is your spirit animal?')]),
    ];

    const errors = new FieldsetValidator().validate([fieldset]);

    assert.strictEqual(errors.length, 0);
  });

  test('<fieldset> with no <legend> tag', async () => {
    const fieldset = new Element('fieldset', {});

    const { message } = new FieldsetValidator().validate([fieldset])?.[0];

    assert.strictEqual(message, messages.fieldset.legend);
  });

  test('<fieldset> with nested <legend> tag', async () => {
    const fieldset = new Element('fieldset', {});
    const legend = new Element('legend', {}, [
      new Text('What is your spirit animal?'),
    ]);
    fieldset.children = [new Element('div', {}, [legend])];

    const { message } = new FieldsetValidator().validate([fieldset])?.[0];

    assert.strictEqual(message, messages.fieldset.legend);
  });

  test('<img> tag missing the alt attribute', async () => {
    const img = new Element('img', { src: 'send.png' });

    const { message } = new ImageValidator().validate([img])?.[0];

    assert.strictEqual(message, messages.img.alt);
  });

  test('<img> tag with an empty alt attribute', async () => {
    const img = new Element('img', { src: 'send.png', alt: '' });

    const errors = new ImageValidator().validate([img]);

    assert.strictEqual(errors.length, 0);
  });

  test('Many <img> elements with same alt-attribute', async () => {
    const img1 = new Element('img', { src: 'beach.png', alt: 'Beach' });
    const img2 = new Element('img', { src: 'beach.png', alt: 'Beach' });
    const img3 = new Element('img', { src: 'beach.png', alt: 'Beach' });
    const img4 = new Element('img', { src: 'beach.png', alt: 'Beach' });

    const { message } = new ImageValidator().validate([
      img1,
      img2,
      img3,
      img4,
    ])?.[0];

    assert.strictEqual(message, messages.img.repeated);
  });

  test('Different <img> elements with same alt-attribute', async () => {
    const images = new Array(10).fill(null).map(
      (_, i) =>
        new Element('img', {
          alt: i % 2 === 0 ? 'Beach' : 'Alps',
        })
    );

    const { message } = new ImageValidator().validate(images)?.[0];

    assert.strictEqual(message, messages.img.repeated);
  });

  test('Two occurrences of <section> without attributes', async () => {
    const section1 = new Element('section', {});
    const section2 = new Element('section', {});

    const { message } = new SectionValidator().validate([
      section1,
      section2,
    ])?.[0];

    assert.strictEqual(message, messages.section.label);
  });

  test('Two occurrences of <section> with attributes', async () => {
    const section1 = new Element('section', { 'aria-label': 'about me' });
    const section2 = new Element('section', { 'aria-label': 'contact' });

    const errors = new SectionValidator().validate([section1, section2]);

    assert.strictEqual(errors.length, 0);
  });

  test('<a> tag with aria-hidden="true"', async () => {
    const a = new Element('a', { href: '/blog', 'aria-hidden': 'true' });

    const { message } = new AriaValidator().validate([a])?.[0];

    assert.strictEqual(message, messages.aria.hidden);
  });

  test('<div> with aria hidden and focusable children', async () => {
    const div = new Element('div', { 'aria-hidden': 'true' }, [
      new Element('a', { href: '/blog' }),
    ]);

    const { message } = new AriaValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.aria.hidden);
  });

  test('<div> with aria hidden and <button> child', async () => {
    const div = new Element('div', { 'aria-hidden': 'true' }, [
      new Element('button', {}, [new Text('click me')]),
    ]);

    const { message } = new AriaValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.aria.hidden);
  });

  test('<div> with aria hidden and <button> child', async () => {
    const link = new Element('a', { href: '/contact' });
    let div = new Element('div', {}, [link]);

    for (let index = 0; index < 2; index++) {
      div = new Element('div', {}, [div]);
    }

    const { message } = new AriaValidator().validate([
      new Element('div', { 'aria-hidden': 'true' }, [div]),
    ])?.[0];

    assert.strictEqual(message, messages.aria.hidden);
  });
});
