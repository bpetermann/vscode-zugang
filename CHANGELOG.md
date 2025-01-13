# Change Log

All notable changes to the "Zugang" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]- 2024-01-12

### Added

**TSX Validation:**

- Added a check to ensure that `<button>` elements don't use abstract roles.
- Added a check to ensure that `<div>` elements don't use abstract roles.

**HTML Validation:**

- Added a check to ensure that `<button>` elements don't use abstract roles.

## [0.1.0]- 2024-09-03

**TSX Validation:**

- Added a check to ensure that `<div>` elements are not improperly used.
- Added a check to ensure that `aria-hidden` can be applied safely.

**HTML Validation:**

- Validation of `aria-hidden` attribute.

## [0.0.6]- 2024-08-31

### Added

**TSX Validation:**

- Validation of `<div>` elements to identify issues like "div soup."
- Validation of `<a>` (link) elements, including checks for generic link text and proper attributes.
- Added validation for `<button>` elements to ensure appropriate text content.

**HTML Validation:**

- Validation of `<section>` elements to ensure appropriate labels are used.
- Added validation for `<button>` elements to check for proper text content.
- Added a check to ensure that `<img>` elements have unique alt attributes.

## [0.0.5]- 2024-08-27

### Added

**TSX Validation:**

- Added support for .tsx files.
- Validation of `<img>` elements (e.g., checking for alt attributes).

**HTML Validation:**

- Added check for consecutive `<div>` elements.

## [0.0.4]- 2024-08-21

### Added

- **HTML Validation:**
- Added validation of `<img>` elements (e.g., alt attribute).

### Changed

- Change node list to element list

## [0.0.3]- 2024-08-18

### Added

**HTML Validation:**

- Added validation of `<button>` elements (e.g., tabindex, switch, and disabled attributes).
- Added validation of `<input>` elements (e.g., checking for existing labels).
- Added validation of `<fieldset>` elements (e.g., checking for existing `<legend>`).

### Changed

- Validation of `<a>` (link) elements now includes the “aria-current” check.
- Separate diagnostic and diagnostic generator

### Fixed

- Missing sibling or child nodes, after line break

## [0.0.2]- 2024-08-16

### Added

**HTML Validation:**

- Added validation of `<div>` elements to ensure they are not improperly used.

### Changed

- Improved performance by processing the entire document only once during validation.
- Nodes are now pre-sorted by a dedicated class (NodeOrganizer), streamlining the validation process.
- Severity of validation errors divided into hints, warnings and errors

## [0.0.1] - 2024-08-15

### Added

**HTML Validation:**

- Validation of heading elements (e.g., proper heading levels, unique `<h1>`).
- Validation of required elements (e.g., `<meta>`, `<title>`).
- Validation of elements that should be unique (e.g., `<html>`, `<title>`).
- Validation of `<nav>` elements with appropriate labels for accessibility.
- Validation of `<a>` (link) elements, including generic link text, proper attributes, and `mailto` links.

[0.0.1]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.0.1
[0.0.2]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.0.2
[0.0.3]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.0.3
[0.0.5]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.0.5
[0.0.6]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.0.6
[0.1.0]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.1.0
[0.2.0]: https://github.com/bpetermann/vscode-zugang/releases/tag/v0.2.0
