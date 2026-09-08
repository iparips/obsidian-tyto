# What Does Not Map

A fourth category, with no equivalent in controller, service, repository. It is
most of what reads as unfamiliar.

## Scoped state

Classes that exist for one turn or one session, holding what that scope spends
and consents to.

| Class                          | Lives for | Holds                             |
| ------------------------------ | --------- | --------------------------------- |
| TurnRepository                 | One turn  | The note, skills, what was opened |
| TurnSpend                      | One turn  | Iterations spent, refusals seen   |
| TurnCancellation               | One turn  | Whether the user stopped it       |
| NotesChosenByUserRepository    | One turn  | What the user consented to write  |
| PathsReturnedByVaultRepository | A session | What a search or read returned    |
| SessionRepository              | A session | The chat history and target note  |

None is a service, because each holds the state it operates on.

Two are repositories in everything but their storage: a collection-like
interface over a Set, written by one collaborator and read by a guard. Scope is
what separates them, and the scope is the point. Finding a note is knowledge and
does not expire; consent to write to it does, so one lives a session and the
other a turn.

The rest are closer to entities, identified by the scope they belong to rather
than by a key. TurnSpend holds two counters and answers whether the budget is
gone, which is nothing being stored or looked up.

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
