---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

The suite renders the header without a stylesheet, so it proves the title is
there and never where it sits. Every check below is a look at the real panel.

## Setup

- The plugin loaded in a real vault, with the session panel open in the sidebar
- The transcript copy setting on for one pass and off for another, since Copy is absent when it is off

### The header names the panel

```gherkin
Given the session panel is open
When  the user looks at the header
Then  an owl glyph and the words Tyto session sit at the left
And   Copy and Reset sit at the right
```

### The glyph reads at header size

```gherkin
Given the session panel is open in a light theme and again in a dark one
When  the user looks at the owl in the header
Then  it is the mark the ribbon shows, and its face is a visible gap
```

The mark fuses into a blob when it renders too small, which is what TytoOwl's
comments are about. The header draws it at the ribbon's own 18 pixels, the size
the glyph was drawn for, so the check is that the two agree in each theme.

### A narrow sidebar keeps both

```gherkin
Given the session panel is open
When  the user drags the sidebar as narrow as it goes
Then  the title is still readable and neither button is clipped
```

D2 says the title is short enough not to need truncating. This is the check that
says so, and a failure here means the wording is wrong rather than the layout.

### The controls are unchanged

```gherkin
Given a session with at least one turn
When  the user presses Copy and then Reset
Then  the transcript reaches the clipboard and the session clears
```

The change moves both buttons in the tree. Pressing each once says the move cost
them nothing.

## Platforms

| Platform | Run     | Result      |
| -------- | ------- | ----------- |
| Desktop  | Not run | Outstanding |
| Mobile   | Not run | Outstanding |

Mobile matters here more than usual: the panel fills the screen rather than a
sidebar, so the row has room the desktop check never exercises.
