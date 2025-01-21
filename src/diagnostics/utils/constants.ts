// ARIA
export const ARIA_HIDDEN = 'aria-hidden' as const;
export const ARIA_LABEL = 'aria-label' as const;
export const ARIA_CHECKED = 'aria-checked' as const;
export const ARIA_LABELLEDBY = 'aria-labelledby' as const;
export const ARIA_EXPANDED = 'aria-expanded' as const;
export const ARIA_CURRENT = 'aria-current' as const;

// ATTRIBUTES
export const TITLE = 'title' as const;
export const TABINDEX = 'tabindex' as const;
export const ROLE = 'role' as const;
export const ONCLICK = 'onclick' as const;
export const LANG = 'lang' as const;
export const NAME = 'name' as const;
export const SWITCH = 'switch' as const;
export const DISABLED = 'disabled' as const;
export const ID = 'id' as const;
export const INERT = 'inert' as const;
export const CONTENT_EDITABLE = 'contenteditable' as const;
export const ALT = 'alt' as const;

// ELEMENTS
export const BUTTON = 'button' as const;
export const INPUT = 'input' as const;
export const TEXTAREA = 'textarea' as const;
export const DIV = 'div' as const;
export const SELECT = 'select' as const;
export const HREF = 'href' as const;
export const UL = 'ul' as const;
export const LI = 'li' as const;
export const SPAN = 'span' as const;
export const SVG = 'svg' as const;
export const IMG = 'img' as const;
export const I = 'i' as const;
export const SECTION = 'section' as const;
export const ARTICLE = 'article' as const;
export const ASIDE = 'aside' as const;
export const NAV = 'nav' as const;
export const HEADER = 'header' as const;
export const FOOTER = 'footer' as const;
export const LINK = 'a' as const;
export const PARAGRAPH = 'p' as const;
export const IFRAME = 'iframe' as const;
export const H1 = 'h1' as const;
export const H2 = 'h2' as const;
export const H3 = 'h3' as const;
export const H4 = 'h4' as const;
export const H5 = 'h5' as const;
export const H6 = 'h6' as const;
export const LABEL = 'label' as const;
export const HTML = 'html' as const;
export const META = 'meta' as const;
export const FIELDSET = 'fieldset' as const;
export const LEGEND = 'legend' as const;
export const MAIN = 'main' as const;
export const FONT_SIZE = 'font-size' as const;
export const FONT_FAMILY = 'font-family' as const;
export const LINE_HEIGHT = 'line-height' as const;

// BOOLEAN
export const TRUE = 'true' as const;
export const FALSE = 'false' as const;

// RELATION
export const TAG = 'tag' as const;
export const CHILD = 'child' as const;
export const SIBLING = 'sibling' as const;

// JSX
export const JSX = 'JSX' as const;
export const JSX_IDENTIFIER = 'JSXIdentifier' as const;
export const JSX_ATTRIBUTE = 'JSXAttribute' as const;
export const JSX_ELEMENT = 'JSXElement' as const;
export const JSX_FRAGMENT = 'JSXFragment' as const;
export const VALUE = 'value' as const;
export const STRING_LITERAL = 'StringLiteral' as const;
export const TYPESCRIPT_REACT = 'typescriptreact' as const;
export const JSX_TEXT = 'JSXText' as const;
export const JSX_MEMBER_EXPRESSION = 'JSXMemberExpression' as const;
export const EXPRESSION = 'expression' as const;
export const OBJECT_EXPRESSION = 'ObjectExpression' as const;
export const OBJECT_PROPERTY = 'ObjectProperty' as const;

// CSS
export const BG_COLOR = 'background-color' as const;
export const PX = 'px' as const;
export const EM = 'em' as const;
export const REM = 'rem' as const;

export const PROBLEMATIC_FONTS = [
  'Comic Sans MS',
  'Papyrus',
  'Brush Script',
  'Vivaldi',
  'Curlz MT',
  'Chiller',
  'Impact',
  'Jokerman',
  'Kristen ITC',
  'Harrington',
  'Broadway',
  'Old English Text MT',
  'Lucida Handwriting',
  'Algerian',
  'Playbill',
];

// GENERIC
export const GENERIC_TEXTS: readonly string[] = [
  'click me',
  'download',
  'here',
  'read more',
  'learn more',
  'click',
  'more',
] as const;

export const GENERIC_ALT: readonly string[] = [
  '.jpg',
  '.png',
  '.webp',
  'image',
  'picture',
  'img',
] as const;

// ABSTRACT ROLES
export const ABSTRACT_ROLES = [
  'command',
  'composite',
  'input',
  'landmark',
  'range',
  'roletype',
  'section',
  'sectionhead',
  'select',
  'structure',
  'widget',
  'window',
] as const;

// HTML
export const ARIA_TAGS = [
  DIV,
  UL,
  LI,
  SPAN,
  SVG,
  IMG,
  I,
  BUTTON,
  INPUT,
  SECTION,
  ARTICLE,
  ASIDE,
  NAV,
  HEADER,
  FOOTER,
  LINK,
  PARAGRAPH,
  IFRAME,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  LABEL,
];

export const STYLE_TAGS = [
  DIV,
  BUTTON,
  SECTION,
  PARAGRAPH,
  HEADER,
  FOOTER,
  LINK,
  NAV,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
] as const;
