---
created: 2026-09-18
updated: 2026-09-18
---

# Decisions

## Requirements

### Decisions

### D1: What answers the script-element error? [open, blocking]

React DOM's resource preloading creates a script element. Nothing in Tyto reaches it: no source file creates one, and the plugin never calls preinit or preloadModule. It is dead code in the bundle, and the scan reads the bundle.

| Option                                        | Cost                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Reply to the review, naming React DOM         | Nothing to build, but the finding is an error rather than a warning, and a person has to accept it |
| Drop React for the panel                      | Weeks of work, and the panel is the plugin's whole surface                                         |
| Bundle react-dom/server or a lighter renderer | The panel needs client rendering; server rendering cannot host it                                  |
| Mark the path dead at build time              | A bundler define or a minifier pass that proves preinit unreachable, if one can                    |

Blocking, because it is the one finding whose answer is not obvious and whose cost ranges from a message to a rewrite. Try the reply first: the finding describes a library every React plugin in the directory ships, so the reviewers have met it before.

### D2: How far does the build have to reproduce? [open]

The scan wants its rebuild to match the released asset. Pinning `bun-version` to the exact version a release was cut with makes CI reproducible against itself, but a contributor on another Bun still gets a different bundle.

| Option                                   | Cost                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Pin bun-version to an exact version      | One line, and the pin needs raising deliberately rather than drifting          |
| Pin, and say the version in CONTRIBUTING | Also tells a contributor which Bun reproduces a release                        |
| Leave it, and accept the warning         | The warning stands on every release, and it is the one that suggests tampering |

Not blocking. A warning rather than an error, but it is the warning most likely to worry a reader, since its own text raises the possibility that the asset was modified after building.

### Assumptions

- The scan reads the release assets rather than the default branch, so a fix needs a new release before it is re-scanned. Everything the earlier spec learnt about the process says so, and the dashboard named release 0.5.0 and commit 82a88af together.
- Removing "Obsidian" from the description satisfies the rule, rather than the rule wanting a rewrite. The message says the word is redundant, not that the description is.
- The capability recommendations are answered in the dashboard rather than in code. If they turn out to want a manifest field, that is a one-line change and this assumption costs nothing.

## Design

No design doc. Four changes: two strings, a version pin and a type. None introduces a class, a seam or a signature.
