---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions: How An Edit Is Written

Every decision is settled. These four replace the anchored batch that corrupted
the reported note; the ones about the retarget that started it are in
[3-decisions.md](3-decisions.md).

## Requirements

### Decisions

#### D6: How does an anchored edit avoid going stale? [resolved 2026-09-16]

By never anchoring against a note it has not just been shown. Ilya: one edit per
step is enforced, so the note is read once per turn step and an anchor is always
computed from the read that preceded it.

A batch is what breaks that, since the second call in one anchors against a note
the first has already changed. Enforcing the step boundary restores the pairing
the anchored tools always assumed: one read, one edit, in that order.

D5 guards a whole-note write. This is the same question for the edit tools that
stay, and Ilya asked it directly: bit-by-bit edits need something too.

The staleness is structural rather than a model failing. NoteContextMessage is
rebuilt per turn step, not per tool call, so every anchor in one batch is
computed from the same snapshot and the note moves underneath them as the batch
applies. The model is never shown the note between its own calls.

| Option                                      | Catches                          | Cost                                              |
|---------------------------------------------|----------------------------------|---------------------------------------------------|
| Stop the batch at the first refusal         | Damage after the first miss      | Taken as D3, and it contains rather than prevents |
| Send the note again after each applied edit | The model's picture drifting     | A note-sized message per call in a batch          |
| Refuse a batch whose anchors overlap        | The drift before any of it lands | A rule for overlapping, computed against the note |
| One edit per step, never a batch            | All of it                        | Chosen, with the whole-note tool paying its cost  |

Two of the four are taken together, and they answer different halves. Enforcing
one edit per step is the fix: it pairs every anchor with the read that precedes
it, which is what the anchored tools always assumed and what a batch quietly
broke. The whole-note write is what makes that affordable, since a scattered
edit that would have cost twelve steps costs one call and one write instead.

The enforcement is what makes the rest hold. A batch exists because a model call
is expensive, not because the edits belong together, and asking a model to
choose the right tool is the guess this spec keeps paying for. Refusing the
second edit in a step is a rule the model cannot misjudge, and the cost falls
only on the case that was already producing stale anchors.

The anchored tools keep the work they are good at. A single targeted edit has no
siblings and no staleness, which is most of what a voice instruction asks for.
What goes is the batch of several, where the note the second anchor was computed
against no longer exists.

Three consequences for the prompt, which is where the batch is asked for today.
ModelsRole says "Multi-part instructions become multiple tool calls, applied in
order", the line that produced the reported session, and it needs to say a
scattered edit is one whole-note write. Its "Never rewrite the whole note"
narrows rather than goes, per D5. And a skill whose workflow is inherently
scattered, as the todo skill's archive is, says so in its own steps rather than
leaving the model to infer it.

D3 narrows to a backstop. With one edit per step there is no batch to stop, so
its rule covers only a batch mixing an edit with other calls, which the refusal
still ends cleanly.

#### D5: What does a whole-note write cost, and what guards it? [resolved 2026-09-16]

Raised by D3's first option. A whole-note tool is the largest change this spec
could make, and it is the one that removes the defect rather than containing it.

| Concern                        | An anchored edit                      | A whole-note write                         |
|--------------------------------|---------------------------------------|--------------------------------------------|
| Content the model did not read | Untouched, since the anchor misses it | Lost, unless the write carries it back     |
| A stale picture of the note    | Refused, loudly                       | Applied, silently overwriting what changed |
| Cost of a wrong call           | One failed anchor                     | The note                                   |

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

| Guard                                 | Catches                              | Cost                                      |
|---------------------------------------|--------------------------------------|-------------------------------------------|
| Refuse unless read_note ran this turn | A model writing from an earlier turn | One flag on the turn repository           |
| The write carries the content it read | The note changing under the model    | The full note in the tool call, both ways |
| The user confirms, as an open does    | Everything, at the cost of a prompt  | A wait on every scattered edit            |

All three. Ilya took the set rather than one: they catch different failures and
compose, so the tool refuses unless a read ran this turn, refuses when the note
has moved under the content it carries, and asks before it lands.

The order matters for what a model sees. The first two are refusals it can act
on, so they come first and the confirmation is only reached by a write that has
already proved itself current.

#### D3: Does a batch stop at the first refused edit? [resolved 2026-09-16]

Yes. Ilya approved stopping at the first refusal. It is small, sits in the
executor loop, and bounds the damage while a batch is still what the model
sends, whichever way D5 lands.


Archived spec 33 raised this as D4 and left it open, calling the case narrower
than the one reported. The reported session is that case.

| Option                                 | Cost                                                              |
|----------------------------------------|-------------------------------------------------------------------|
| A whole-note write for scattered edits | A new tool, and it reverses a standing rule in the system prompt  |
| Stop the batch at the first refusal    | A batch of independent edits loses the ones after the failure     |
| Apply all, report each                 | What happens today, and what duplicated the user's content        |
| Refuse the batch when anchors overlap  | Needs a rule for what overlapping means, computed before applying |

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

#### D4: Is the model told its anchors go stale within a batch? [resolved 2026-09-16]

Absorbed by D6. The prompt change it asked for is one of the three D6 names:
ModelsRole stops asking for a batch of anchored edits.

Telling the model its anchors go stale was the weaker version of the same fix.
It explains a hazard where D6 removes it, and a prompt line the model must
remember mid-batch is a worse guard than a tool with no batch.

### Assumptions

- A refused anchor means the model's picture of the note is stale, rather than
  the anchor being wrong from the start. Both produce the same refusal. If a
  first-call refusal is common in practice, stopping the batch punishes a model
  that got one anchor wrong and the rest right.
