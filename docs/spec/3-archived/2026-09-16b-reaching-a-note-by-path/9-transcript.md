---
created: 2026-09-16
updated: 2026-09-16
---

# The Reported Session

The steps that show the disagreement, from a session copied on 2026-09-16. The
prompt parts are omitted: what matters is that the two blocks below reached the
model in the same request.

## Turn 2, Step 4

The model had asked read_note for the shopping list. The result:

```text
## Top Ups
- [ ] deodorant spray
- [ ] by thermos for Sophie
- [ ] eggs
```

The note context sent with the same request, naming the same session:

```text
Note path: 1 - Journal/Weekly/Week-38/shopping-list.md
Cursor line: 0
This is the note as it is right now, re-read from the editor. It supersedes any
earlier copy or description in this conversation, including your own.
Note content:
## Tyto
- [x] get a sense of how long of a recording can I do before it stops.
- [ ] better visual indicator that it's listening. A countdown perhaps
...
```

One path, two contents. The second is a daily note, which the session had
resolved an editor for while naming the shopping list. That resolve is fixed by
[following-the-user-mid-turn](../2026-09-16a-following-the-user-mid-turn/1-index.md).

## What The Model Did With It

Steps 3 to 7 are five identical read_note calls, each answered with the shopping
list, while every note context kept saying otherwise. Then:

```text
8.  insert_text "## Tyto"        refused: anchor matches multiple places
10. insert_text "## Tyto\n- [x] get a sense..."   applied
11. insert_text "## Top Ups"     refused: anchor not found
13. insert_text "## Top Ups"     refused: anchor not found
14. insert_text "## Top Ups"     refused: anchor not found
```

The anchors it took from the note context matched the daily note, and the ones
it took from read_note did not exist in what the edit tool was writing to. Step
10 is the edit that landed in the wrong note.

Even with the resolve fixed, the two sources remain different: an unsaved editor
and its file disagree until Obsidian writes it.
