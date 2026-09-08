# What Does Not Map

A fourth category, with no equivalent in controller, service, repository. It is
most of what reads as unfamiliar.

## Scoped state

Classes that exist for one turn or one session, holding what that scope spends
and consents to.

| Class                          | Lives for | Block      |
| ------------------------------ | --------- | ---------- |
| PathsReturnedByVaultRepository | A session | Repository |
| NotesChosenByUserRepository    | One turn  | Repository |
| SessionRepository              | A session | Repository |
| TurnRepository                 | One turn  | Repository |
| TurnSpend                      | One turn  | Entity     |
| TurnCancellation               | One turn  | Unsettled  |

None is a service, because each holds the state it operates on.

The four repositories hold state across calls to their own methods, written by
one collaborator and read by another. That the storage is a Set or a field
rather than a disk is what separates them from SkillRepository, which reads the
vault. Both meanings of the word are in use here, which is worth knowing before
adding a third class to either group.

TurnSpend is an entity: its counts change throughout a turn while its identity
stays that turn's. Two instances both at three iterations are not
interchangeable, and handing the loop the wrong one would spend the wrong
budget.

TurnCancellation is deliberately unlabelled. It holds one flag that flips once,
which is thin for an entity, and it hands out an AbortSignal that kills an
in-flight request and a promise that resolves on abort. That is a signal rather
than a record, and no block names it well.

## Concurrency plumbing

| Class          | Bridges                                       |
| -------------- | --------------------------------------------- |
| PendingAnswer  | A promise against a cancellation              |
| Asker          | A person clicking to a turn that awaits       |
| UtteranceQueue | One utterance at a time, without interleaving |

These carry no domain meaning at all. They are described in
[architecture/8-parking-a-turn.md](../../architecture/8-parking-a-turn.md).

## Why the category exists

A controller, service, repository stack assumes a request that arrives, does
work, and returns. Nothing survives between requests except what a repository
persisted.

A turn is different in three ways, and each one produces classes the model has
no slot for.

- It is long-lived. A turn spans many model calls, and what it opened and spent
  has to survive between them.
- It can pause on a person. The user picking a note is not a database read: it
  may never happen, so the turn holds a promise nothing else can settle.
- It can be stopped mid-flight. A cancel has to reach an in-flight HTTP request,
  a parked question and the loop, which is three shapes of one fact.

Naming these Service would make them longer without making them clearer. What
they need is a category of their own, which this file is.

## The name that misleads

Four classes end in Repository and two of them read the vault. The other two
hold fields.

A reader who knows the layered model reads SessionRepository and expects
persistence. What they get is a chat history in memory, discarded when the
plugin reloads. That is the single clearest mismatch between the model and the
code.
