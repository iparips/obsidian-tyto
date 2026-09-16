---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D5: What does a whole-note write cost, and what guards it? [open, blocking]

Raised by D3's first option. A whole-note tool is the largest change this spec
could make, and it is the one that removes the defect rather than containing it.

| Concern                        | An anchored edit                     | A whole-note write                          |
|--------------------------------|--------------------------------------|---------------------------------------------|
| Content the model did not read | Untouched, since the anchor misses it | Lost, unless the write carries it back      |
| A stale picture of the note    | Refused, loudly                      | Applied, silently overwriting what changed  |
| Cost of a wrong call           | One failed anchor                    | The note                                    |

The second row is the sharp one. An anchored edit fails safe on a stale picture,
which is why the reported session cost three duplicated blocks rather than the
file. A whole-note write applies whatever it was given.

Undo answers half of it. Every edit goes through `editor.replaceRange`, the
CodeMirror API Obsidian gives a plugin, and nothing in the tree writes to the
vault directly. So a model's edit sits in the editor's own undo stack and Ctrl-Z
reverses it, exactly as it reverses a typed one. A whole-note write is one
`replaceRange` over the full range, so one Ctrl-Z takes it back.

That is weaker than it sounds, for three reasons worth stating rather than
discovering. The stack is per editor, so closing the tab loses it. A batch of
five anchored edits is five undos where one whole-note write is one, which
favours the rewrite. And undo only helps a user who notices: a silent
overwrite of a paragraph they had not looked at recently is one they may never
think to undo.

So undo lowers the cost of a wrong call without removing the need for a guard.
It turns "the note" into "the note, until the tab closes", which is enough to
make the tool worth having and not enough to ship it unguarded.

The guard options, cheapest first:

| Guard                                | Catches                                  | Cost                                       |
|--------------------------------------|------------------------------------------|--------------------------------------------|
| Refuse unless read_note ran this turn | A model writing from an earlier turn     | One flag on the turn repository            |
| The write carries the content it read | The note changing under the model        | The full note in the tool call, both ways  |
| The user confirms, as an open does    | Everything, at the cost of a prompt      | A wait on every scattered edit             |

The first is where D5 leans: it is the cheapest, it matches the guard the edit
tools already carry for a refused open, and it addresses the failure the reported
session actually had, which was a model writing from a snapshot it took before
its own edits landed.

Blocking, since the tool cannot be specified without it.

#### D4: Is the model told its anchors go stale within a batch? [open]

The system prompt says multi-part instructions become multiple tool calls
applied in order. It does not say that an anchor computed from the current note
is stale once a sibling call lands.

Not blocking, and it is a prompt change, which this repo treats as a behaviour
change needing a real vault to judge. Worth doing only if D3 leaves cases where
a model can still batch overlapping anchors.

#### D1: What happens to a turn the user retargets under it? [resolved 2026-09-16]

It finishes on the note it started. Ilya: the note change kicks in only once the
original utterance has been processed.

The turn is mid-instruction on one note and the user opens another. Following is
the rule and this spec does not reopen it; what the running turn does about it is
what was unsettled.

| Option                           | The archive turn would have                     | Cost                                                        |
|----------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| Continue, and tell the model     | Carried on, told the note changed               | The model may still finish an instruction on the wrong note |
| Finish on the note it started    | Completed the archive, bound the new note after | Chosen                                                      |
| End the turn, saying what it did | Stopped, named the edits already applied        | An instruction half-applied, which is the state to avoid    |

An utterance is the unit the user asked for, so half-applying one is what to
avoid. Ending the turn leaves the instruction incomplete instead, which is the
same harm moved. Finishing and then following leaves neither partial.

The session still binds to the new note when the event fires. What defers is the
running turn's own target, so the turn writes where it began and the next starts
where the user is.

A command opening a note mid-turn is untouched: ToolDispatcher reaches the turn
repository directly, where the user's retarget arrives through the runner.

#### D2: Does the model need telling at all? [resolved 2026-09-16]

No, and D1 settles it. A turn finishing on the note it started never sees the
new one, so there is nothing to tell it, and the next turn reads the change in
its own note context as every between-turn retarget already does.

Archived spec 33's removal of the history message therefore stands unamended.

#### D3: Does a batch stop at the first refused edit? [resolved 2026-09-16]

Yes. Ilya approved stopping at the first refusal. It is small, sits in the
executor loop, and bounds the damage while a batch is still what the model
sends, whichever way D5 lands.


Archived spec 33 raised this as D4 and left it open, calling the case narrower
than the one reported. The reported session is that case.

| Option                                   | Cost                                                                  |
|------------------------------------------|-----------------------------------------------------------------------|
| A whole-note write for scattered edits   | A new tool, and it reverses a standing rule in the system prompt      |
| Stop the batch at the first refusal      | A batch of independent edits loses the ones after the failure         |
| Apply all, report each                   | What happens today, and what duplicated the user's content            |
| Refuse the batch when anchors overlap    | Needs a rule for what overlapping means, computed before applying     |

The whole-note option below is not closed by this: it removes the need for a
batch rather than changing what one does, so the two sit side by side. D5 holds
it.

The whole-note option is Ilya's: an edit scattered across a note, such as archiving a todo
list, is better expressed as one rewrite than as a line-by-line batch. It is the
only option that removes the stale-anchor problem rather than detecting it,
because a single write has no siblings to go stale against.

Two things stand in its way, neither fatal. There is no whole-note tool: the
three edit tools are replace_text, insert_text and insert_at, all anchored. And
ModelsRole says "Never rewrite the whole note; make the smallest targeted edits
that satisfy the instruction", so the rule needs narrowing rather than a tool
added beside it.

The rule exists for a reason worth keeping: a model rewriting a note it has only
partly read loses whatever it did not echo back. Archiving is safe from that
only because the todo skill has it read the file first. The narrowing is
therefore not "rewrite when you like" but closer to "rewrite only what you read
in full this turn", which D5 costs out.

### Assumptions

- A turn finishing on the note the user has left is short enough that they do
  not see edits landing in a note they are no longer watching. A turn is a
  handful of model calls, and the panel names the note each edit reached. If a
  long turn makes that read as the session ignoring them, the fallback is to
  end the turn instead, which D1 weighed and did not take.
- A refused anchor means the model's picture of the note is stale, rather than
  the anchor being wrong from the start. Both produce the same refusal. If a
  first-call refusal is common in practice, stopping the batch punishes a model
  that got one anchor wrong and the rest right.

## Design

Written when the design is.
