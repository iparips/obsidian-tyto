# The Panel's Vocabulary

What each word means when the panel, the transcript and the engine use it.
Cross-cutting, like [7-package-design.md](7-package-design.md), so it names the
package beside each class.

One concept takes one word across the codebase. Three levels nest, and the
middle one never reaches the screen, which is what made the outer two easy to
confuse.

## The three levels

| Level         | Is                                            | Count in a session | On screen        |
| ------------- | --------------------------------------------- | ------------------ | ---------------- |
| Turn          | One utterance and everything that follows it  | One per utterance  | Yes, as a block  |
| Turn step     | One model call and the tool calls it returned | Many per turn      | No               |
| Progress line | One thing the turn did, in the user's terms   | Many per turn      | Yes, in the list |

A turn step is not a progress line, and the two are not one-to-one.

- One model call can publish several lines. A batch of three edits refuses the
  second and third, which is two lines from one call.
- One model call can publish none. A call answering in text publishes an answer
  entry rather than a line.
- A line can precede every model call. The resolved instructions are reported
  before the first, which is why the transcript writes them under Setup rather
  than under a turn step.

So a line belongs to the turn. Most fall inside a turn step, and the transcript
nests them there; the ones that do not still belong to the turn that produced
them.

## Turn, and what a turn holds

A session is a list of turns. A turn is a container (PanelTurn [Session
Models]), holding its target and its entries, so the grouping is a fact rather
than something worked out by scanning back to the last utterance.

The target is the note the turn writes to. It is fixed for the turn: set from
the session's note when the turn opens, and moved only by the model calling a
tool that opens another. The user opening a note mid-turn sets the target for
the next turn, never for the running one.

## The entry kinds

Eleven kinds a turn can hold, grouped by what each is worth on screen
(EntryWeights [Session Models]). Six read as replies and five as context, so
the panel reads as a conversation rather than as eleven kinds of box.

| Weight    | Kind         | Is                                            |
| --------- | ------------ | --------------------------------------------- |
| utterance | user         | What the user said                            |
| reply     | assistant    | The model's closing summary                   |
| reply     | answer       | An answer drawn from search, with its sources |
| reply     | error        | The turn failed                               |
| reply     | cancelled    | The user stopped the turn                     |
| reply     | choice       | The notes offered, and which was picked       |
| reply     | question     | The one question asked, and its suggestions   |
| context   | progress     | The collapsed list of progress lines          |
| context   | instructions | The AGENTS.md chain that applied              |
| context   | warning      | The turn nearing its step budget              |
| context   | restored     | Where a restored session picks up             |
| context   | retargeted   | The session moved to another note             |

An assistant entry and an answer entry are both the model talking, and differ in
three ways. The assistant entry is the turn's ending, is appended to the chat
history for the next turn to read, and happens once. An answer is a tool result
mid-turn, cites the notes it drew on, never reaches the chat history, and can
happen any number of times.

Two of these read an answer back, which the engine's one-way publisher cannot
do, so they are held apart as the two ways a turn parks on the user.

- Choice. The model offers candidates and the user picks one. Pending while the
  rows are live.
- Question. The model asks one thing, with suggestions. Pending while it is
  answerable.

Both settle when answered or when the turn ends, and the settled text stays as
a record of what was asked.

## Retarget, which belongs to no turn

A retarget is the session moving to another note. It is a session event rather
than a turn event: it belongs to the moment it happened, so no turn owns it and
nothing is appended to the chat history to carry it.

Only the user's own moves reach the timeline. A tool that opened a note said so
in its progress line already, and moves the open turn's target instead.

## How a turn ends

Five endings (TurnEndingKind [Engine Turn Ending]), so the transcript reads the
ending rather than inferring it.

| Ending    | Is                                               | Panel shows        |
| --------- | ------------------------------------------------ | ------------------ |
| Replied   | The model answered in text                       | An assistant entry |
| Cancelled | The user stopped it, between steps or mid-flight | A cancelled entry  |
| Failed    | The provider failed                              | An error entry     |
| Exhausted | The step budget ran out                          | An error entry     |
| Stuck     | The same refusal twice                           | An error entry     |

Exhausted and Stuck are recorded apart and shown as one message, because the
user's way out of both is the same.

## Words this file settles

| Concept                            | Word          | Not                                 |
| ---------------------------------- | ------------- | ----------------------------------- |
| One utterance and its consequences | Turn          | Conversation turn, in prose         |
| One model call                     | Turn step     | Iteration, step                     |
| One line of the panel's list       | Progress line | Turn step, panel step, step         |
| The entry collecting those lines   | progress      | steps                               |
| The note a turn writes to          | Target        | Bound note, open note, current note |
| The session moving note            | Retarget      | Rebind, note change                 |

## References

- [9-an-utterance-and-its-answer.md](9-an-utterance-and-its-answer.md) - how the utterance reaches the engine and the ending comes back
- [11-the-two-records.md](11-the-two-records.md) - the two lists a turn writes itself into
- [8-parking-a-turn.md](8-parking-a-turn.md) - the choice and the question, and how a parked turn settles
